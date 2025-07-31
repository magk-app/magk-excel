import os
from typing import List, Literal

from localstack import config as localstack_config
from localstack import constants as localstack_constants
from localstack.config import is_env_true
from localstack.utils.urls import localstack_host

FALSE_STRINGS = localstack_constants.FALSE_STRINGS

ROOT_FOLDER = os.path.realpath(os.path.join(os.path.dirname(os.path.realpath(__file__)), ".."))

# list of folders (within the localstack_ext module) which are *not* protected (i.e., published unencrypted)
UNPROTECTED_FOLDERS = ["aws", "bootstrap", "cli", "packages", "testing"]
# list of filenames (within the localstack_ext module) which are *not* protected (i.e., published unencrypted)
UNPROTECTED_FILES = ["plugins.py", "packages.py"]

# api server config
API_URL = localstack_constants.API_ENDPOINT

# localhost IP address and hostname
LOCALHOST_IP = "127.0.0.1"

# base domain name used for endpoints of created resources (e.g., CloudFront distributions)
RESOURCES_BASE_DOMAIN_NAME = (
    os.environ.get("RESOURCES_BASE_DOMAIN_NAME", "").strip() or localstack_host().host
)

# SMTP settings (required, e.g., for Cognito)
SMTP_HOST = os.environ.get("SMTP_HOST", "")
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASS = os.environ.get("SMTP_PASS", "")
SMTP_EMAIL = os.environ.get("SMTP_EMAIL", "")

# whether to transparently set the target endpoint (by passing $AWS_ENDPOINT_URL) in
#  AWS SDK clients used in user code (e.g., Lambdas). default: true
TRANSPARENT_LOCAL_ENDPOINTS = localstack_config.is_env_not_false("TRANSPARENT_LOCAL_ENDPOINTS")

# whether to disable transparent endpoint injection or not
DISABLE_TRANSPARENT_ENDPOINT_INJECTION = localstack_config.is_env_true(
    "DISABLE_TRANSPARENT_ENDPOINT_INJECTION"
)

# whether to enforce IAM policies when processing requests
ENFORCE_IAM = localstack_config.is_env_true("ENFORCE_IAM")
IAM_SOFT_MODE = localstack_config.is_env_true("IAM_SOFT_MODE")

# endpoint URL for kube cluster (defaults to https://<docker_bridge_ip>:6443)
KUBE_ENDPOINT = os.environ.get("KUBE_ENDPOINT", "")

# toggle developer mode for extensions
EXTENSION_DEV_MODE = localstack_config.is_env_true("EXTENSION_DEV_MODE")

# List of extensions that should be installed when localstack starts
EXTENSION_AUTO_INSTALL: List[str] = [
    e.strip() for e in (os.environ.get("EXTENSION_AUTO_INSTALL") or "").split(",") if e.strip()
]

# ---
# service-specific configurations
# ---

# the endpoint strategy for AppSync GraphQL endpoints
GRAPHQL_ENDPOINT_STRATEGY: Literal["legacy", "domain", "path"] = (
    os.environ.get("GRAPHQL_ENDPOINT_STRATEGY", "") or "legacy"
)

# PUBLIC: 1 (default, pro) Only applies to new lambda provider.
# Whether to download public Lambda layers from AWS through a LocalStack proxy when creating or updating functions.
LAMBDA_DOWNLOAD_AWS_LAYERS = localstack_config.is_env_not_false("LAMBDA_DOWNLOAD_AWS_LAYERS")

# PUBLIC: 0 (default, pro) Only applies to new lambda provider
# Whether to use java sdk v2 certificate validation disabling java agent
LAMBDA_DISABLE_JAVA_SDK_V2_CERTIFICATE_VALIDATION = localstack_config.is_env_true(
    "LAMBDA_DISABLE_JAVA_SDK_V2_CERTIFICATE_VALIDATION"
)

# PUBLIC: amazon/aws-lambda- (default, pro)
# Prefix for images that will be used to execute Lambda functions in Kubernetes.
LAMBDA_K8S_IMAGE_PREFIX = os.environ.get("LAMBDA_K8S_IMAGE_PREFIX") or "amazon/aws-lambda-"

# Kubernetes lambda executor pod labels. Will be added to all spawned pods
LAMBDA_K8S_LABELS = os.environ.get("LAMBDA_K8S_LABELS")

# Kubernetes lambda executor pod security context. Will be set on all spawned pods
LAMBDA_K8S_SECURITY_CONTEXT = os.environ.get("LAMBDA_K8S_SECURITY_CONTEXT")

# Comma-separated hosts for which pip won't verify SSL while installing packages within MWAA container.
# Useful for LocalStack sessions inside proxied networks which inject custom SSL certificates.
# eg. 'pypi.org,pythonhosted.org,files.pythonhosted.org'
MWAA_PIP_TRUSTED_HOSTS = os.environ.get("MWAA_PIP_TRUSTED_HOSTS")

# whether to use static ports and IDs (e.g., cf-<port>) for CloudFormation distributions
CLOUDFRONT_STATIC_PORTS = localstack_config.is_env_true("CLOUDFRONT_STATIC_PORTS")

# whether to remove task containers after execution
ECS_REMOVE_CONTAINERS = localstack_config.is_env_not_false("ECS_REMOVE_CONTAINERS")

# additional flags passed to Docker engine when creating ECS task containers
ECS_DOCKER_FLAGS = os.environ.get("ECS_DOCKER_FLAGS", "").strip()

# additional flags passed to Docker engine when creating Dockerised EC2 instances
EC2_DOCKER_FLAGS = os.environ.get("EC2_DOCKER_FLAGS", "")

# whether default Docker images are downloaded at provider startup which can be used as AMIs
EC2_DOWNLOAD_DEFAULT_IMAGES = localstack_config.is_env_not_false("EC2_DOWNLOAD_DEFAULT_IMAGES")

# EC2 VM manager which is a supported hypervisor or container engine
EC2_VM_MANAGER = os.environ.get("EC2_VM_MANAGER", "").strip() or "docker"

# simulated delay (in seconds) for creating clusters in EKS mocked mode
EKS_MOCK_CREATE_CLUSTER_DELAY = int(os.environ.get("EKS_MOCK_CREATE_CLUSTER_DELAY", "0").strip())

# startup timeout for an EKS cluster
EKS_STARTUP_TIMEOUT = int(os.environ.get("EKS_STARTUP_TIMEOUT", "180").strip())

# Port where Hive/metastore/Spark are available for EMR/Athena
PORT_HIVE_METASTORE = int(os.getenv("PORT_HIVE_METASTORE") or 9083)
PORT_HIVE_SERVER = int(os.getenv("PORT_HIVE_SERVER") or 10000)
PORT_SPARK_MASTER = int(os.getenv("PORT_SPARK_MASTER") or 7077)
PORT_SPARK_UI = int(os.getenv("PORT_SPARK_UI") or 4040)

# option to force a hard-coded Spark version to be used for EMR jobs
EMR_SPARK_VERSION = str(os.getenv("EMR_SPARK_VERSION") or "").strip()

# whether to lazily install and spin up custom Postgres versions
RDS_PG_CUSTOM_VERSIONS = localstack_config.is_env_not_false("RDS_PG_CUSTOM_VERSIONS")

# whether official MySQL is supported, spins up a MySQL docker container
RDS_MYSQL_DOCKER = localstack_config.is_env_not_false("RDS_MYSQL_DOCKER")

# whether Cluster Endpoints should return the hostname only
RDS_CLUSTER_ENDPOINT_HOST_ONLY = localstack_config.is_env_not_false(
    "RDS_CLUSTER_ENDPOINT_HOST_ONLY"
)

# whether DocDB should use a proxied docker container for mongodb
DOCDB_PROXY_CONTAINER = localstack_config.is_env_true("DOCDB_PROXY_CONTAINER")

# options to mount local filesystem folders as S3 buckets
S3_DIR = str(os.getenv("S3_DIR") or "").strip()

# CLI file path to the auth cache populated by `localstack auth`
AUTH_CACHE_PATH = os.path.join(localstack_config.CONFIG_DIR, "auth.json")


def is_auth_token_set_in_cache() -> bool:
    """Whether the LOCALSTACK_AUTH_TOKEN was set via the `localstack auth` method. CLI-specific method."""
    # FIXME: it would probably be better to have some basic abstractions for auth token and credentials that
    #  are defined in bootstrap.auth and bootstrap.licensingv2 already in the config, then we could
    #  consolidate some of the code. until then, we need to do this "lightweight" parsing of the auth cache
    #  file.

    if not os.path.isfile(AUTH_CACHE_PATH):
        return False

    try:
        import json

        with open(AUTH_CACHE_PATH, "rb") as fd:
            if json.load(fd).get("LOCALSTACK_AUTH_TOKEN"):
                return True
    except Exception:
        pass

    return False


def is_api_key_configured() -> bool:
    """Whether an API key is set in the environment."""
    # TODO: this method is too general for it's name. needs to be cleaned up with a clean concept for
    #  authentication that reconciles API_KEY, AUTH_TOKEN, `localstack auth`, and `localstack login`.
    if os.environ.get("LOCALSTACK_AUTH_TOKEN", "").strip():
        return True

    if is_env_true("LOCALSTACK_CLI") and is_auth_token_set_in_cache():
        return True

    if os.environ.get("LOCALSTACK_API_KEY", "").strip():
        return True

    return False


# whether pro should be activated or not. this is set to true by default if using the pro image. if set to
# true, localstack will fail to start if the key activation did not work. if set to false, then we will make
# an attempt to start localstack community.
ACTIVATE_PRO = localstack_config.is_env_not_false("ACTIVATE_PRO")

# a comma-separated list of cloud pods to be automatically loaded at startup
AUTO_LOAD_POD = os.environ.get("AUTO_LOAD_POD", "")

if is_env_true("LOCALSTACK_CLI"):
    # when we're in the CLI, we only want to activate pro code if an API key is set. this is because we are
    # always loading localstack_ext/config.py in the CLI, and we would otherwise always have ACTIVATE_PRO=1
    # when running `localstack start`.
    ACTIVATE_PRO = ACTIVATE_PRO and is_api_key_configured()
    # we also need to update the environment so `ACTIVATE_PRO` is disabled in the container
    os.environ["ACTIVATE_PRO"] = "1" if ACTIVATE_PRO else "0"

# backend service ports
DEFAULT_PORT_LOCAL_DAEMON = 4600
DEFAULT_PORT_LOCAL_DAEMON_ROOT = 4601
DISABLE_LOCAL_DAEMON_CONNECTION = localstack_config.is_env_true("DISABLE_LOCAL_DAEMON_CONNECTION")

# name of CI project to sync usage events and state with (TODO: deprecate `CI_PROJECT`)
CI_PROJECT = os.environ.get("LS_CI_PROJECT") or os.environ.get("CI_PROJECT") or ""

# Controls the snapshot granularity of the run. The lower the interval, the more snapshot metamodels are created
COMMIT_INTERVAL_SECS = os.environ.get("COMMIT_INTERVAL_SECS", 10)

# Controls the synchronization rate of the run. The lower the rate, the more remote synchronization requests are performed.
#  Note: If the container shuts down gracefully a synchronization request is done at the very end of the run, otherwise
#   all results up until the last synchronization request are lost.
SYNCHRONIZATION_RATE = os.environ.get("SYNCHRONIZATION_RATE", 1)

# Additional flags provided to the batch container
# only flags for volumes, ports, environment variables and add-hosts are allowed
BATCH_DOCKER_FLAGS = os.environ.get("BATCH_DOCKER_FLAGS", "")

# timeout (in seconds) to wait before returning from load operations on the CLI; 60 by default
POD_LOAD_CLI_TIMEOUT = int(os.getenv("POD_LOAD_CLI_TIMEOUT", "60"))

# whether to enforce explicit provider loading (if not set, by default providers "<x>" will be overridden by "<x>_pro")
PROVIDER_FORCE_EXPLICIT_LOADING = is_env_true("PROVIDER_FORCE_EXPLICIT_LOADING")

# whether to ignore the existing appsync js libs path
APPSYNC_JS_LIBS_VERSION = os.getenv("APPSYNC_JS_LIBS_VERSION", "latest")

# update variable names that need to be passed as arguments to Docker
localstack_config.CONFIG_ENV_VARS += [
    "ACTIVATE_PRO",
    "APPSYNC_JS_LIBS_VERSION",
    "AUTO_LOAD_POD",
    "AUTOSTART_UTIL_CONTAINERS",
    "BIGDATA_MONO_CONTAINER",  # Not functional; deprecated in 2.2.0, removed in 3.0.0
    "CI_PROJECT",
    "CLOUDFRONT_STATIC_PORTS",
    "DISABLE_LOCAL_DAEMON_CONNECTION",
    "DOCDB_PROXY_CONTAINER",
    "ECS_REMOVE_CONTAINERS",
    "ECS_DOCKER_FLAGS",
    "EC2_DOCKER_FLAGS",
    "EC2_DOWNLOAD_DEFAULT_IMAGES",
    "EC2_VM_MANAGER",
    "EKS_MOCK_CREATE_CLUSTER_DELAY",
    "EKS_STARTUP_TIMEOUT",
    "ENFORCE_IAM",
    "EXTENSION_DEV_MODE",
    "EXTENSION_AUTO_INSTALL",
    "GRAPHQL_ENDPOINT_STRATEGY",
    "IAM_SOFT_MODE",
    "KUBE_ENDPOINT",
    "LAMBDA_DOWNLOAD_AWS_LAYERS",
    "LOG_LICENSE_ISSUES",
    "LS_CI_PROJECT",
    "LS_CI_LOGS",
    "PERSIST_ALL",
    "SMTP_EMAIL",
    "SMTP_HOST",
    "SMTP_PASS",
    "SMTP_USER",
    "SSL_NO_VERIFY",
    "SYNC_POD_NAME",
    "TRANSPARENT_LOCAL_ENDPOINTS",
    "DISABLE_TRANSPARENT_ENDPOINT_INJECTION",
    "PERSIST_FLUSH_STRATEGY",
    "PROVIDER_FORCE_EXPLICIT_LOADING",
    "RDS_MYSQL_DOCKER",
    "RDS_CLUSTER_ENDPOINT_HOST_ONLY",
    "POD_LOAD_CLI_TIMEOUT",
    "NEPTUNE_DB_TYPE",
    # Removed in 3.0.0
    "LAMBDA_XRAY_INIT",  # deprecated since 2.0.0
]

# re-initialize configs in localstack
localstack_config.populate_config_env_var_names()
