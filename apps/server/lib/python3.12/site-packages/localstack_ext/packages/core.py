_A='install'
import functools,logging,os,threading
from abc import ABC
from typing import Callable,List
from localstack import config
from localstack.packages import InstallTarget,PackageInstaller,SystemNotSupportedException,package
from localstack.utils.platform import in_docker,is_debian,is_redhat
from localstack.utils.run import run
LOG=logging.getLogger(__name__)
OS_PACKAGE_INSTALL_LOCK=threading.RLock()
_DEBIAN_CACHE_DIR=os.path.join(config.dirs.cache,'apt')
class OSPackageInstaller(PackageInstaller,ABC):
	def __init__(A,name,version):super().__init__(name,version,OS_PACKAGE_INSTALL_LOCK)
	def _get_install_dir(A,target):return A._os_switch(debian=A._debian_get_install_dir,redhat=A._redhat_get_install_dir,debian_fallback=True,target=target)
	@staticmethod
	def _os_switch(debian,redhat,debian_fallback=False,**A):
		if in_docker()and is_redhat():return redhat(**A)
		if is_debian()or not in_docker()and debian_fallback:return debian(**A)
		elif not in_docker():raise SystemNotSupportedException('OS level packages are only installed within docker containers.')
		else:raise SystemNotSupportedException('The current operating system is currently not supported.')
	def _prepare_installation(A,target):
		B=target
		if B!=InstallTarget.STATIC_LIBS:LOG.warning('%s will be installed as an OS package, even though install target is _not_ set to be static.',A.name)
		A._os_switch(debian=A._debian_prepare_install,redhat=A._redhat_prepare_install,target=B)
	def _install(A,target):A._os_switch(debian=A._debian_install,redhat=A._redhat_install,target=target)
	def _post_process(A,target):A._os_switch(debian=A._debian_post_process,redhat=A._redhat_post_process,target=target)
	def _get_install_marker_path(A,install_dir):return A._os_switch(debian=A._debian_get_install_marker_path,redhat=A._redhat_get_install_marker_path,debian_fallback=True,install_dir=install_dir)
	def _debian_get_install_dir(A,target):raise SystemNotSupportedException(f"There is no supported installation method for {A.name} on Debian.")
	def _debian_get_install_marker_path(A,install_dir):raise SystemNotSupportedException(f"There is no supported installation method for {A.name} on Debian.")
	def _debian_packages(A):raise SystemNotSupportedException(f"There is no supported installation method for {A.name} on Debian.")
	def _debian_prepare_install(A,target):run(A._debian_cmd_prefix()+['update'])
	def _debian_install(A,target):B=A._debian_packages();LOG.debug('Downloading packages %s to folder: %s',B,_DEBIAN_CACHE_DIR);C=A._debian_cmd_prefix()+['-d',_A]+B;run(C);C=A._debian_cmd_prefix()+[_A]+B;run(C)
	def _debian_post_process(A,target):0
	def _debian_cmd_prefix(A):return['apt',f"-o=dir::cache={_DEBIAN_CACHE_DIR}",f"-o=dir::cache::archives={_DEBIAN_CACHE_DIR}",'-y','--no-install-recommends']
	def _redhat_get_install_dir(A,target):raise SystemNotSupportedException(f"There is no supported installation method for {A.name} on RedHat.")
	def _redhat_get_install_marker_path(A,install_dir):raise SystemNotSupportedException(f"There is no supported installation method for {A.name} on Redhat.")
	def _redhat_packages(A):raise SystemNotSupportedException(f"There is no supported installation method for {A.name} on RedHat.")
	def _redhat_prepare_install(A,target):0
	def _redhat_install(A,target):run(['dnf',_A,'-y']+A._redhat_packages())
	def _redhat_post_process(A,target):run(['dnf','clean','all'])
pro_package=functools.partial(package,scope='ext')