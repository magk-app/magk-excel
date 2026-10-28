import socket
import json
from unittest.mock import patch

import pytest
from chalice.test import Client

from app import app
from chalicelib import url_safety


AUTH_HEADERS = {
    'Authorization': 'Bearer test-token',
    'Content-Type': 'application/json',
}
AUTH_ONLY_HEADERS = {'Authorization': 'Bearer test-token'}


def public_getaddrinfo(hostname, port, *args, **kwargs):
    return [
        (socket.AF_INET, socket.SOCK_STREAM, 6, '', ('93.184.215.14', port))
    ]


def address_getaddrinfo(hostname, port, *args, **kwargs):
    return [
        (socket.AF_INET, socket.SOCK_STREAM, 6, '', (hostname, port))
    ]


@pytest.fixture
def test_client(monkeypatch):
    """Create a Chalice client with hermetic public DNS and auth."""
    monkeypatch.setenv('MAGK_API_TOKEN', 'test-token')
    monkeypatch.setattr(
        url_safety.socket, 'getaddrinfo', public_getaddrinfo)
    return Client(app)


def workflow_body(source_uri='https://example.com'):
    return {
        'sourceType': 'web',
        'sourceUri': source_uri,
        'dataIdentifier': 'test-table',
    }


def encoded_body(body):
    return json.dumps(body)


class TestAppRoutes:
    def test_index_route(self, test_client):
        response = test_client.http.get('/')

        assert response.status_code == 200
        assert response.json_body == {'message': 'MAGK Excel Backend API'}

    def test_health_route(self, test_client):
        response = test_client.http.get('/health')

        assert response.status_code == 200
        assert response.json_body == {
            'status': 'healthy',
            'service': 'magk-excel-backend',
        }

    def test_execute_workflow_options(self, test_client):
        response = test_client.http.options('/execute-workflow')

        assert response.status_code == 200
        assert 'Access-Control-Allow-Origin' in response.headers
        assert response.headers['Access-Control-Allow-Origin'] == '*'


class TestAuthorization:
    @patch('app.extract_web_table')
    def test_missing_token_is_denied(self, mock_extract, test_client):
        response = test_client.http.post(
            '/execute-workflow',
            headers={'Content-Type': 'application/json'},
            body=encoded_body(workflow_body()),
        )

        assert response.status_code in (401, 403)
        mock_extract.assert_not_called()

    @patch('app.extract_web_table')
    def test_wrong_token_is_denied(self, mock_extract, test_client):
        response = test_client.http.post(
            '/execute-workflow',
            headers={
                'Authorization': 'Bearer wrong-token',
                'Content-Type': 'application/json',
            },
            body=encoded_body(workflow_body()),
        )

        assert response.status_code == 403
        mock_extract.assert_not_called()

    @patch('app.extract_web_table')
    def test_unset_token_environment_is_denied(
            self, mock_extract, test_client, monkeypatch):
        monkeypatch.delenv('MAGK_API_TOKEN')
        response = test_client.http.post(
            '/execute-workflow',
            headers=AUTH_HEADERS,
            body=encoded_body(workflow_body()),
        )

        assert response.status_code == 403
        mock_extract.assert_not_called()

    @patch('app.scrape_manually_reconstruct')
    def test_hk_endpoint_requires_token(self, mock_scrape, test_client):
        response = test_client.http.post(
            '/extract-hk-immigration',
            headers={'Content-Type': 'application/json'},
            body=encoded_body(
                {'startDate': '20250101', 'endDate': '20250101'}),
        )

        assert response.status_code in (401, 403)
        mock_scrape.assert_not_called()


class TestExecuteWorkflow:
    def test_execute_workflow_missing_body(self, test_client):
        response = test_client.http.post(
            '/execute-workflow',
            headers=AUTH_ONLY_HEADERS,
        )

        assert response.status_code == 400
        assert 'Request body is required' in response.json_body['Message']

    def test_execute_workflow_missing_fields(self, test_client):
        response = test_client.http.post(
            '/execute-workflow',
            headers=AUTH_HEADERS,
            body=encoded_body({'sourceType': 'web'}),
        )

        assert response.status_code == 400
        assert 'Missing required fields' in response.json_body['Message']

    def test_execute_workflow_unsupported_source_type(self, test_client):
        body = {
            'sourceType': 'unsupported',
            'sourceUri': 'https://example.com',
            'dataIdentifier': 'test-table',
        }

        response = test_client.http.post(
            '/execute-workflow',
            headers=AUTH_HEADERS,
            body=encoded_body(body),
        )

        assert response.status_code == 400
        assert 'Unsupported source type' in response.json_body['Message']

    def test_execute_workflow_pdf_not_implemented(self, test_client):
        body = {
            'sourceType': 'pdf',
            'sourceUri': 'https://example.com/test.pdf',
            'dataIdentifier': 'table1',
        }

        response = test_client.http.post(
            '/execute-workflow',
            headers=AUTH_HEADERS,
            body=encoded_body(body),
        )

        assert response.status_code == 500
        assert 'not yet implemented' in response.json_body['Message']

    @patch('app.extract_web_table')
    def test_execute_workflow_web_success(self, mock_extract, test_client):
        mock_extract.return_value = [
            ['Name', 'Age', 'City'],
            ['Alice', '25', 'New York'],
            ['Bob', '30', 'San Francisco'],
        ]

        response = test_client.http.post(
            '/execute-workflow',
            headers=AUTH_HEADERS,
            body=encoded_body(workflow_body()),
        )

        assert response.status_code == 200
        response_data = response.json_body
        assert response_data['status'] == 'success'
        assert response_data['rowCount'] == 3
        assert response_data['columnCount'] == 3
        assert len(response_data['sampleData']) == 3
        assert 'outputUrl' in response_data
        mock_extract.assert_called_once_with(
            'https://example.com', 'test-table')

    @patch('app.extract_web_table')
    def test_execute_workflow_web_no_data(self, mock_extract, test_client):
        mock_extract.return_value = []

        response = test_client.http.post(
            '/execute-workflow',
            headers=AUTH_HEADERS,
            body=encoded_body(workflow_body()),
        )

        assert response.status_code == 500
        assert 'No data extracted' in response.json_body['Message']

    @patch('app.extract_web_table')
    def test_execute_workflow_web_extraction_error(
            self, mock_extract, test_client):
        mock_extract.side_effect = Exception('secret detail')

        response = test_client.http.post(
            '/execute-workflow',
            headers=AUTH_HEADERS,
            body=encoded_body(workflow_body()),
        )

        assert response.status_code == 500
        assert 'Internal server error' in response.json_body['Message']
        assert 'secret detail' not in response.json_body['Message']


@pytest.mark.parametrize('source_uri', [
    'file:///tmp',
    'http://127.0.0.1:9001/',
    'http://169.254.169.254/',
    'http://10.0.0.1/',
    'http://[::1]/',
    'http://0.0.0.0/',
    'ftp://example.com',
    'javascript:alert(1)',
    'https://user:pass@example.com',
    123,
])
@patch('app.extract_web_table')
def test_ssrf_urls_are_rejected(
        mock_extract, test_client, monkeypatch, source_uri):
    monkeypatch.setattr(
        url_safety.socket, 'getaddrinfo', address_getaddrinfo)

    response = test_client.http.post(
        '/execute-workflow',
        headers=AUTH_HEADERS,
        body=encoded_body(workflow_body(source_uri)),
    )

    assert response.status_code == 400
    mock_extract.assert_not_called()


@patch('app.extract_web_table')
def test_hostname_resolving_to_private_address_is_rejected(
        mock_extract, test_client, monkeypatch):
    monkeypatch.setattr(
        url_safety.socket, 'getaddrinfo',
        lambda *args, **kwargs: address_getaddrinfo('127.0.0.1', 80),
    )

    response = test_client.http.post(
        '/execute-workflow',
        headers=AUTH_HEADERS,
        body=encoded_body(workflow_body('https://rebind.example')),
    )

    assert response.status_code == 400
    mock_extract.assert_not_called()


@patch('app.extract_web_table')
def test_mixed_public_and_private_resolution_is_rejected(
        mock_extract, test_client, monkeypatch):
    monkeypatch.setattr(
        url_safety.socket, 'getaddrinfo',
        lambda *args, **kwargs: [
            (socket.AF_INET, socket.SOCK_STREAM, 6, '',
             ('93.184.215.14', 80)),
            (socket.AF_INET, socket.SOCK_STREAM, 6, '',
             ('10.0.0.1', 80)),
        ],
    )

    response = test_client.http.post(
        '/execute-workflow',
        headers=AUTH_HEADERS,
        body=encoded_body(workflow_body('https://mixed.example')),
    )

    assert response.status_code == 400
    mock_extract.assert_not_called()


@patch('app.extract_web_table')
def test_dns_failure_is_rejected(mock_extract, test_client, monkeypatch):
    def fail_resolution(*args, **kwargs):
        raise socket.gaierror('DNS failure')

    monkeypatch.setattr(
        url_safety.socket, 'getaddrinfo', fail_resolution)
    response = test_client.http.post(
        '/execute-workflow',
        headers=AUTH_HEADERS,
        body=encoded_body(workflow_body('https://unresolvable.example')),
    )

    assert response.status_code == 400
    mock_extract.assert_not_called()


class TestCORSHeaders:
    def test_cors_headers_added(self, test_client):
        response = test_client.http.get('/health')

        assert response.status_code == 200
        assert 'Access-Control-Allow-Origin' in response.headers
        assert response.headers['Access-Control-Allow-Origin'] == '*'