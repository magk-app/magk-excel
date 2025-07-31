_A='java'
import glob,logging,os
from typing import List
import distro
from localstack.packages import InstallTarget,Package
from localstack.utils.files import save_file
from localstack.utils.http import download
from localstack.utils.run import run
from localstack_ext.packages import OSPackageInstaller
LOG=logging.getLogger(__name__)
DEFAULT_JAVA_VERSION='11'
JAVA_VERSIONS=['8','11']
JAVA_11_HOME=os.environ.get('JAVA_11_HOME')or'/usr/lib/jvm/java-11'
JAVA_8_HOME=os.environ.get('JAVA_8_HOME')or'/usr/lib/jvm/java-8'
ADOPTIUM_DNS_SKIP='jfrog-prod-.*.s3.amazonaws.com'
class JavaPackageInstaller(OSPackageInstaller):
	def __init__(A,version):super().__init__(_A,version)
	def is_installed(B):A=B.get_java_home();return A and os.path.exists(os.path.join(A,'bin',_A))
	def _debian_get_install_dir(A,target):return A._get_jvm_install_dir()
	def _debian_get_install_marker_path(A,install_dir):return os.path.join(install_dir,'bin',_A)
	def _debian_packages(A):
		if A.version==DEFAULT_JAVA_VERSION:return[]
		return[f"temurin-{A.version}-jdk"]
	def _debian_prepare_install(B,target):
		A='/etc/apt/sources.list.d/adoptium.list';C='/etc/apt/trusted.gpg.d/adoptium.asc';D='https://packages.adoptium.net/artifactory'
		if B.version!=DEFAULT_JAVA_VERSION and not os.path.exists(A):download(f"{D}/api/gpg/key/public",C);save_file(A,f"deb https://packages.adoptium.net/artifactory/deb {distro.codename()} main")
		try:from localstack.dns import server as E;E.exclude_from_resolution(ADOPTIUM_DNS_SKIP)
		except ImportError:LOG.debug('Cannot import DNS server - skipping modification to allow apt download')
		super()._debian_prepare_install(target)
	def _post_process(A,target):
		try:from localstack.dns import server as C;C.revert_exclude_from_resolution(ADOPTIUM_DNS_SKIP)
		except ImportError:LOG.debug('Cannot import DNS server - skipping revert of skip')
		B=A._get_jvm_install_dir();D=glob.glob(f"/usr/lib/jvm/*-{A.version}-jdk-*")[0]
		if not os.path.exists(B):run(['ln','-s',D,B])
	def _get_jvm_install_dir(A):return A.get_java_home()
	def get_java_home(A):
		if A.version=='8':return JAVA_8_HOME
		if A.version=='11':return JAVA_11_HOME
		return f"/usr/lib/jvm/java-{A.version}"
class JavaPackage(Package):
	def __init__(A,default_version=DEFAULT_JAVA_VERSION):super().__init__(name='Java',default_version=default_version)
	def get_versions(A):return JAVA_VERSIONS
	def _get_installer(A,version):return JavaPackageInstaller(version)
java_package=JavaPackage()