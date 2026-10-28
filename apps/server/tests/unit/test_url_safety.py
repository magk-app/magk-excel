import socket

import pytest

from chalicelib import url_safety
from chalicelib.url_safety import UnsafeURLError, host_matches, validate_public_url


def public_resolution(hostname, port, *args, **kwargs):
    return [
        (socket.AF_INET, socket.SOCK_STREAM, 6, '', ('93.184.215.14', port))
    ]


@pytest.fixture(autouse=True)
def mock_dns(monkeypatch):
    monkeypatch.setattr(
        url_safety.socket, 'getaddrinfo', public_resolution)


@pytest.mark.parametrize('url', [
    'http://example.com',
    'https://example.com/path',
    'HTTPS://EXAMPLE.COM./path',
])
def test_validate_public_url_accepts_http_urls(url):
    validated = validate_public_url(url)

    assert validated.url == url
    assert validated.hostname == 'example.com'
    assert validated.address == '93.184.215.14'


@pytest.mark.parametrize('url', [
    None,
    123,
    '',
    'https://example.com with-space',
    'https://example.com\n',
    'https://example.com' + ('a' * 2048),
    'file:///tmp',
    'ftp://example.com',
    'javascript:alert(1)',
    'https://user:pass@example.com',
    'https://example.com:invalid',
])
def test_validate_public_url_rejects_unsafe_urls(url):
    with pytest.raises(UnsafeURLError):
        validate_public_url(url)


@pytest.mark.parametrize('url, hostname, expected', [
    ('https://EXAMPLE.com./page', 'example.com', True),
    ('http://example.com', 'example.com', True),
    ('ftp://example.com', 'example.com', False),
    ('https://other.example.com', 'example.com', False),
    ('https://user:pass@example.com', 'example.com', True),
    ('not a URL', 'example.com', False),
])
def test_host_matches_normalizes_http_hosts(url, hostname, expected):
    assert host_matches(url, hostname) is expected


def test_validate_public_url_rejects_empty_resolution(monkeypatch):
    monkeypatch.setattr(url_safety.socket, 'getaddrinfo', lambda *a, **k: [])

    with pytest.raises(UnsafeURLError):
        validate_public_url('https://example.com')


def test_validate_public_url_rejects_ipv6_loopback_resolution(monkeypatch):
    monkeypatch.setattr(
        url_safety.socket, 'getaddrinfo',
        lambda *a, **k: [
            (socket.AF_INET6, socket.SOCK_STREAM, 6, '', ('::1', 443))
        ],
    )

    with pytest.raises(UnsafeURLError):
        validate_public_url('https://[::1]')


@pytest.mark.parametrize('address', [
    '127.0.0.1',
    '10.0.0.1',
    '169.254.169.254',
    '::1',
    '::ffff:127.0.0.1',
])
def test_validate_public_url_rejects_non_public_resolution(monkeypatch, address):
    monkeypatch.setattr(
        url_safety.socket, 'getaddrinfo',
        lambda *a, **k: [
            (socket.AF_INET, socket.SOCK_STREAM, 6, '', (address, 80))
        ],
    )

    with pytest.raises(UnsafeURLError):
        validate_public_url('https://example.com')
