_A='timestamp'
import hashlib,logging,os
from typing import Dict
import requests
from localstack import config
from localstack.utils.json import FileMappedDocument
from localstack.utils.strings import to_bytes
from localstack.utils.time import now_utc
from localstack_ext.bootstrap.pods_client import get_pods_endpoint
LOG=logging.getLogger(__name__)
def get_url_digest(url):A=hashlib.sha1();A.update(to_bytes(url));return A.hexdigest()
class CloudPodsCache:
	cache_file:str;cache_validity:int
	def __init__(A,cache_file='pods_cache.json',cache_validity=180):A.cache_file=cache_file;A.cache_validity=cache_validity
	def should_fetch(B,cache_data):
		A=cache_data
		if A is None:return True
		if now_utc()-int(A.get(_A))>B.cache_validity:return True
		return False
	def get_pods_cache(A):return FileMappedDocument(os.path.join(config.dirs.cache,A.cache_file))
	def update_cache(D,digest):A=digest;E=str(int(now_utc()));B=os.path.join(config.dirs.cache,A);C=D.get_pods_cache();C.update({A:{'path':B,_A:E}});C.save();return B
	def get_cached_pod_path(A,url):
		D=get_url_digest(url);B=A.get_pods_cache();C=B.get(D)
		if A.should_fetch(C):requests.post(f"{get_pods_endpoint()}/launchpad/fetch",params={'url':url});B=A.get_pods_cache();C=B.get(D)
		E=C.get('path');return E