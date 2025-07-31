NIL_PTR = "NIL"

# well-defined directory names
ASSETS_ROOT_DIR = "assets"
DEFAULT_POD_DIR = "cloudpods"
OBJ_STORE_DIR = "objects"

VERSION_FILE = "version.yaml"

# regex pattern for cloud pod names
POD_NAME_PATTERN = "^[a-zA-Z0-9_-]+$"
# regex pattern for cloud pod versions - currently only numeric versions supported
POD_VERSION_PATTERN = r"\d+"

# The name of the zip file containing cloud pod state (i.e., pickled stores and assets)
STATE_ZIP = "pod_state"
# The name of the zip file containing the full version history
VERSIONS_ARCHIVE = "version"
# Compression format for the cloud pod
COMPRESSION_FORMAT = "zip"

# well-defined file names
VERSION_SPACE_DIRS = [OBJ_STORE_DIR, VERSION_FILE]

# header name that indicates internal requests made to LocalStack
INTERNAL_REQUEST_PARAMS_HEADER = "x-localstack-data"
