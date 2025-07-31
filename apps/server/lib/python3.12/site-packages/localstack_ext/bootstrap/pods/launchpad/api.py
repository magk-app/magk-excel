import json,logging,urllib.parse,requests,werkzeug.exceptions
from localstack.http import route
from localstack.utils.files import load_file
from werkzeug import Request,Response
from werkzeug.exceptions import BadRequest,InternalServerError
from localstack_ext.bootstrap.pods.launchpad.cache import CloudPodsCache,get_url_digest
from localstack_ext.bootstrap.pods_client import inject_pod_endpoint,read_metadata_from_pod
from localstack_ext.constants import API_PATH_PODS
LOG=logging.getLogger(__name__)
LAUNCHPAD_PATH=f"{API_PATH_PODS}/launchpad"
class LaunchPadApi:
	pods_cache:CloudPodsCache
	def __init__(A):A.pods_cache=CloudPodsCache()
	def launchpad_fetch(D,request):
		try:A=unquote_and_validate_url(request)
		except werkzeug.exceptions.HTTPException as B:return Response(B.description,B.code)
		E=get_url_digest(A);C=D.pods_cache.update_cache(E);LOG.debug("Fetching Pod's content from %s to %s",A,C)
		def F():
			B=requests.get(A,stream=True);F=int(B.headers['Content-Length']);D=0
			with open(C,'wb')as G:
				for E in B.iter_content(chunk_size=100000):D+=len(E);G.write(E);yield f"{D/F}\n"
		return Response(F(),mimetype='text/plain')
	launchpad_fetch_route=route(f"{LAUNCHPAD_PATH}/fetch",methods=['POST'])(launchpad_fetch)
	def launchpad_metadata(C,request):
		try:D=unquote_and_validate_url(request)
		except werkzeug.exceptions.HTTPException as A:return Response(A.description,A.code)
		B=C.pods_cache.get_cached_pod_path(D);LOG.debug("Reading Pod's content from cached path %s",B);return Response(response=json.dumps(read_metadata_from_pod(B)),content_type='application/json')
	launchpad_metadata_route=route(f"{LAUNCHPAD_PATH}/metadata",methods=['GET'])(launchpad_metadata)
	def launchpad_inject(C,request):
		try:D=unquote_and_validate_url(request)
		except werkzeug.exceptions.HTTPException as A:return Response(A.description,A.code)
		B=C.pods_cache.get_cached_pod_path(D);LOG.debug("Loading Pod's content from cached path %s",B);E=load_file(B,mode='rb');F=inject_pod_endpoint(content=E)
		if not F:return Response('Load failed',status=500)
	launchpad_inject_route=route(f"{LAUNCHPAD_PATH}/inject",methods=['POST'])(launchpad_inject)
def unquote_and_validate_url(request):
	A=request.values.get('url')
	if not A:raise BadRequest(description='Missing url as a query string parameter')
	try:A=urllib.parse.unquote(A);requests.head(A)
	except Exception:raise InternalServerError(description=f"Can't reach the specified URL: {A}")
	return A