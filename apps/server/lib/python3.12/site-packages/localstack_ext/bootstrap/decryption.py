_A='_ls_patch_applied'
import inspect,os.path,sys,tempfile,tokenize,traceback
from importlib.abc import MetaPathFinder,SourceLoader
from importlib.util import spec_from_file_location
import pyaes
from localstack.utils.files import load_file
from localstack.utils.patch import patch
from localstack.utils.strings import to_str
class DecryptionHandler:
	decryption_key:bytes
	def __init__(A,decryption_key):A.decryption_key=decryption_key
	def decrypt(C,content):D=pyaes.AESModeOfOperationCBC(C.decryption_key,iv='\x00'*16);B=pyaes.Decrypter(D);A=B.feed(content);A+=B.feed();A=A.partition(b'\x00')[0];return A
class EncryptedFileFinder(MetaPathFinder):
	decryption_handler:DecryptionHandler
	def __init__(A,decryption_handler):A.decryption_handler=decryption_handler
	def find_spec(E,fullname,path,target=None):
		C=fullname;A=path
		if A and not isinstance(A,list):A=list(getattr(A,'_path',[]))
		if not A:return
		F=C.split('.')[-1];D=os.path.join(A[0],F+'.py');B=D+'.enc'
		if not os.path.isfile(B):return
		if os.path.isfile(D):return
		return spec_from_file_location(C,B,loader=DecryptingLoader(B,E.decryption_handler))
class DecryptingLoader(SourceLoader):
	decryption_handler:DecryptionHandler
	def __init__(A,encrypted_file,decryption_handler):A.encrypted_file=encrypted_file;A.decryption_handler=decryption_handler
	def get_filename(A,fullname):return A.encrypted_file
	def get_data(B,filename):
		with open(filename,'rb')as C:A=C.read()
		A=B.decryption_handler.decrypt(A);return A
def init_source_decryption(decryption_handler):A=decryption_handler;sys.meta_path.insert(0,EncryptedFileFinder(A));patch_traceback_lines();patch_inspect_findsource();patch_tokenize_open(A)
def patch_traceback_lines():
	if getattr(traceback.FrameSummary,_A,None):return
	@property
	def A(self):
		A=self
		try:return B.fget(A)
		except Exception:A._line='';return A._line
	B=traceback.FrameSummary.line;traceback.FrameSummary.line=A;traceback.FrameSummary._ls_patch_applied=True
def patch_inspect_findsource():
	if getattr(inspect,_A,None):return
	def A(*A,**C):
		try:return B(*A,**C)
		except Exception:return[],0
	B=inspect.findsource;inspect.findsource=A;inspect._ls_patch_applied=True
def patch_tokenize_open(decryption_handler):
	@patch(tokenize.open)
	def A(fn,filename,*C,**D):
		A=filename
		try:return fn(A,*C,**D)
		except Exception as E:
			if'missing encoding declaration'in str(E)and A.endswith('.py.enc'):
				F=load_file(A,mode='rb');G=to_str(decryption_handler.decrypt(F))
				with tempfile.NamedTemporaryFile('w+t')as B:B.write(G);B.seek(0);return fn(B.name,*C,**D)
			raise