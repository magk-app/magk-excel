_A='platform'
import logging,os
from typing import Callable,Optional
from urllib.parse import urlparse
import boto3
LOG=logging.getLogger(__name__)
PARAM_ACCESS_KEY_ID='access_key_id'
PARAM_SECRET_ACCESS_KEY='secret_access_key'
PARAM_SESSION_TOKEN='session_token'
def get_s3_remote_params():
	try:B=boto3.session.Session();A=B.get_credentials();return{PARAM_ACCESS_KEY_ID:A.access_key,PARAM_SECRET_ACCESS_KEY:A.secret_key,PARAM_SESSION_TOKEN:A.token}
	except Exception as C:LOG.debug('Unable to extract remote parameters: %s',C)
	return{}
def get_oras_remote_params():
	D='oras_password';C='oras_username';A=os.getenv('ORAS_USERNAME')or os.getenv(C);B=os.getenv('ORAS_PASSWORD')or os.getenv(D)
	if not A or not B:raise Exception('Please specify ORAS_USERNAME and ORAS_PASSWORD in the environment')
	return{C:A,D:B}
def get_platform_remote_params():
	A=os.getenv('LOCALSTACK_API_KEY');B=os.getenv('LOCALSTACK_AUTH_TOKEN');C=os.getenv('LOCALSTACK_BEARER_TOKEN')
	if not A and not B and not C:raise Exception('Please specify LOCALSTACK_API_KEY/LOCALSTACK_AUTH_TOKEN or LOCALSTACK_BEARER_TOKEN in the environment')
	return{'api_key':A,'auth_token':B,'bearer_token':C}
remotes_protocols={'s3':get_s3_remote_params,'oras':get_oras_remote_params,_A:get_platform_remote_params}
def get_remote_params_callable(url):A=urlparse(url).scheme or _A;return remotes_protocols.get(A,None)