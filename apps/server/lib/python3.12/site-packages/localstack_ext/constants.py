from localstack_ext import __version__

# version of localstack-ext
# TODO deprecated - use localstack-ext.__version__ instead
VERSION = __version__

# default expiry seconds for Cognito access tokens (1h by default in AWS)
TOKEN_EXPIRY_SECONDS = 60 * 60

# name of Docker registry for Lambda images
DEFAULT_LAMBDA_DOCKER_REGISTRY = "localstack/lambda"

# request path for local pod management API
API_PATH_PODS = "/_localstack/pods"
DEPRECATED_API_PATH_PODS = "/_pods"

# name and URL of S3 bucket containing assets that are downloaded at build or runtime
S3_ASSETS_BUCKET = "localstack-assets"
S3_ASSETS_BUCKET_URL = f"https://{S3_ASSETS_BUCKET}.s3.amazonaws.com"

# Root directory for pickled (persisted) states
API_STATES_DIRECTORY = "api_states"
# Root directory for the persisted assets
ASSETS_DIRECTORY = "assets"

# Filename for pickled (persisted) Moto BackendDict
MOTO_BACKEND_STATE_FILE = "backend.state"

# Filename for pickled (persisted) provider AccountRegionBundle
STORE_STATE_FILE = "store.state"

# Metadata file for pods that are locally stored and not updated to the platform
CLOUDPODS_METADATA_FILE = "metadata.yaml"

# active MQ download URL
ACTIVE_MQ_URL = "https://dlcdn.apache.org/activemq/5.16.6/apache-activemq-5.16.6-bin.tar.gz"

UPDATE_HTTP_METHODS = ["POST", "PUT", "DELETE", "PATCH"]

# This file holds a list of services that are stored in the snapshot.
API_STATES_JSON = "api_states.json"
