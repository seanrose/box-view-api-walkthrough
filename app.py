from time import sleep
from flask import Flask, request, render_template, jsonify
from boxview import BoxViewClient
from boxviewerror import BoxViewError

app = Flask(__name__)


@app.route('/')
def index():

    return render_template('index.html')


@app.route('/upload', methods=['POST'])
def upload_document():
    """
    Upload a document to the Box View service

    Expects a json with the following fields
        box_view_token: a valid box view token
        url: a valid url to pdf or office document
    """

    request_json = request.get_json()

    box_view_token = request_json['box_view_token']
    box_view_client = BoxViewClient(box_view_token)

    url = request_json['url']

    try:
        document = box_view_client.upload_document(url).json()
    except(BoxViewError):
        return jsonify({'error': 'an error occurred'}), 400

    document_id = document['id']

    print 'Document ID is {}'.format(document_id)

    return jsonify(document)


@app.route('/session', methods=['POST'])
def create_session():
    """
    Create a session for a Box view document

    Expects a json with the following fields
        box_view_token: a valid box view token
        document_id: a valid url to pdf or office document
    """

    request_json = request.get_json()

    box_view_token = request_json['box_view_token']
    box_view_client = BoxViewClient(box_view_token)
    document_id = request_json['document_id']

    document_ready = False
    while not document_ready:
        sleep(1)
        document_ready = box_view_client.ready_to_view(document_id)

    try:
        session = box_view_client.create_session(document_id).json()
    except(BoxViewError):
        return jsonify({'error': 'an error occurred'}), 400

    session_url = box_view_client.create_session_url(session['id'])

    print 'Session is {}'.format(session_url)

    combined_response = {
        'session_url': session_url,
        'session': session
    }

    return jsonify(combined_response)


@app.route('/link')
def link_generator():
    return render_template('link.html')

@app.route('/upload-convert', methods=['POST'])
def upload_convert_document():
    """
    """

    box_view_client = BoxViewClient('esmmrytsvw3sgl0ulvzkxlcli2huetls')
    uploaded_file = request.files['file']

    try:
        document = box_view_client.multipart_upload_document(uploaded_file)
    except(BoxViewError):
        return jsonify({'error': 'an error occurred'}), 400

    document_id = document.json()['id']
    print 'Document ID is {}'.format(document_id)

    document_ready = False
    wait_time = 0
    while not document_ready:
        sleep(1)
        wait_time += 1
        document_ready = box_view_client.ready_to_view(document_id)
        print '{} seconds elaspe'.format(wait_time)

    try:
        session = box_view_client.create_session(document_id).json()
    except(BoxViewError):
        return jsonify({'error': 'an error occurred'}), 400

    session_url = box_view_client.create_session_url(session['id'])

    print 'Session is {}'.format(session_url)

    combined_response = {
        'session_url': session_url,
        'session': session
    }

    return jsonify(combined_response)

if __name__ == '__main__':
    app.debug = True
    app.run()
