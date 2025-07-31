import json
from abc import ABC,abstractmethod
from typing import Dict,List,Optional
import requests
from localstack import config
from localstack_ext.bootstrap.pods.constants import INTERNAL_REQUEST_PARAMS_HEADER
from localstack_ext.constants import API_PATH_PODS
class CloudPodsRemotesInterface(ABC):
	@abstractmethod
	def create_remote(self,name,protocols,remote_url=None):0
	@abstractmethod
	def delete_remote(self,name):0
	@abstractmethod
	def get_remote(self,name):0
	@abstractmethod
	def get_remotes(self):0
class CloudPodsRemotesClient(CloudPodsRemotesInterface):
	@property
	def endpoint(self):return f"{config.external_service_url()}{API_PATH_PODS}/remotes"
	def create_remote(A,name,protocols,remote_url=None):
		C={'name':name,'protocols':protocols,'remote_url':remote_url};B=A._client.post(url=f"{A.endpoint}/{name}",data=json.dumps(C),headers={'Content-Type':'application/json'})
		if not B.ok:raise Exception(f"Failed to create remote: {B.content}")
	def delete_remote(A,name):
		B=A._client.delete(url=f"{A.endpoint}/{name}")
		if not B.ok:raise Exception(f"Failed to delete remote: {B.content}")
	def get_remotes(B):
		A=B._client.get(url=B.endpoint)
		if not A.ok:raise Exception(f"Failed to get list of remotes: {A.content}")
		C=json.loads(A.content);return C.get('remotes',[])
	def get_remote(B,name):
		A=B._client.get(url=f"{B.endpoint}/{name}")
		if not A.ok:raise Exception(f"Failed to get remote: {A.content}")
		C=json.loads(A.content);return C
	def get_token(B):
		A=B._client.get(url=f"{B.endpoint}/token")
		if A.status_code==404:return
		if not A.ok:raise Exception(f"Failed to get token: {A.content}")
		C=json.loads(A.content);return C.get('token')
	@property
	def _client(self):A=requests.Session();A.headers.update({INTERNAL_REQUEST_PARAMS_HEADER:'{}'});return A