"""URL validation helpers for outbound web extraction."""

from dataclasses import dataclass
import ipaddress
import socket
from urllib.parse import urlsplit


class UnsafeURLError(ValueError):
    """Raised when a URL is not safe for outbound requests."""


@dataclass(frozen=True)
class ValidatedURL:
    url: str
    hostname: str
    address: str


def validate_public_url(url) -> ValidatedURL:
    """Validate an HTTP(S) URL and resolve it to public addresses."""
    if not isinstance(url, str):
        raise UnsafeURLError("URL must be a string")
    if not url:
        raise UnsafeURLError("URL must not be empty")
    if len(url) > 2048:
        raise UnsafeURLError("URL is too long")
    if any(character.isspace() or ord(character) < 32 or ord(character) == 127
           for character in url):
        raise UnsafeURLError("URL must not contain whitespace or control characters")

    try:
        parsed = urlsplit(url)
    except ValueError:
        raise UnsafeURLError("URL is invalid")

    scheme = parsed.scheme.lower()
    if scheme not in {"http", "https"}:
        raise UnsafeURLError("URL scheme must be http or https")
    try:
        hostname = parsed.hostname
    except ValueError:
        raise UnsafeURLError("URL is invalid")
    if not hostname:
        raise UnsafeURLError("URL must include a hostname")
    if parsed.username is not None or parsed.password is not None:
        raise UnsafeURLError("URL must not include userinfo")
    try:
        port = parsed.port
    except ValueError:
        raise UnsafeURLError("URL has an invalid port")

    hostname = hostname.lower().rstrip(".")
    try:
        addresses = socket.getaddrinfo(
            hostname,
            port or (443 if scheme == "https" else 80),
            type=socket.SOCK_STREAM,
        )
    except (socket.gaierror, UnicodeError):
        raise UnsafeURLError("URL hostname could not be resolved")
    if not addresses:
        raise UnsafeURLError("URL hostname could not be resolved")

    resolved_addresses = []
    for address_info in addresses:
        try:
            address = address_info[4][0]
            ip = ipaddress.ip_address(address.split("%")[0])
            if isinstance(ip, ipaddress.IPv6Address) and ip.ipv4_mapped:
                ip = ip.ipv4_mapped
        except (IndexError, TypeError, ValueError):
            raise UnsafeURLError("URL hostname could not be resolved")
        if not ip.is_global or ip.is_multicast:
            raise UnsafeURLError("URL must resolve to a public address")
        resolved_addresses.append(address)

    return ValidatedURL(url, hostname, resolved_addresses[0])


def host_matches(url: str, hostname: str) -> bool:
    """Return whether an HTTP(S) URL has the expected normalized hostname."""
    try:
        parsed = urlsplit(url)
        if parsed.scheme.lower() not in {"http", "https"}:
            return False
        parsed_hostname = parsed.hostname
    except (TypeError, ValueError):
        return False
    return bool(parsed_hostname) and parsed_hostname.lower().rstrip(".") == hostname
