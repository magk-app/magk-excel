import os.path,traceback
from localstack import config
from localstack_ext import config as config_ext
from.repository import SubprocessLineStream,get_extension_repository
def log(msg):print(f"Localstack extensions installer: {msg}")
def main():
	if not config_ext.ACTIVATE_PRO:return
	A=os.path.join(config.dirs.config,'extensions.txt');B=config_ext.EXTENSION_AUTO_INSTALL
	if not os.path.exists(A)and not B:return
	C=get_extension_repository()
	if os.path.exists(A):
		log(f"installing extensions defined in {A}");E=[C.pip,'install','--no-input','--no-color','--disable-pip-version-check','-r',A]
		with SubprocessLineStream.open(E)as F:
			for G in F:log(G)
	log('installing extensions defined EXTENSIONS_AUTO_INSTALL')
	for D in B:
		log(f"auto installing extension {D}")
		try:
			for H in C.run_install(name_or_url=D):log(H.get('message'))
		except Exception as I:log(f"{I}");log(traceback.format_exc())
if __name__=='__main__':main()