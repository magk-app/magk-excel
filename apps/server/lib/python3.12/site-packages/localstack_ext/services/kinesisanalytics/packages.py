_B='siddhi-sdk'
_A='localstack-5.1.0.post2'
import os
from typing import List
from localstack.packages import InstallTarget,Package,PackageInstaller
from localstack.packages.api import MultiPackageInstaller
from localstack.packages.core import ArchiveDownloadAndExtractInstaller,DownloadInstaller,SystemNotSupportedException
from localstack.utils.platform import get_arch
from localstack.utils.run import run
SIDDHI_SDK_URL='https://github.com/siddhi-io/siddhi-sdk/releases/download/v{version}/siddhi-sdk-{version}.zip'
SIDDHI_SDK_VERSION='5.1.2'
SIDDHI_PY_URL='https://github.com/siddhi-io/PySiddhi/releases/download/v{version}/siddhi-python-api-proxy-{version}.jar'
PYSIDDHI_PIP_DL_URL='https://files.pythonhosted.org/packages/f4/be/9ccdd1d9190b7a5f9991dd523250649f42298d7b9a4740d406c0f6810daf/PySiddhi_localstack-5.1.0.post2-py2.py3-none-any.whl#sha256=3744d9950a97b27fa0f162238b6e8479956fee17cf8738db2ec4521307b8a316'
class PySiddhiPackage(Package):
	def __init__(A):super().__init__('PySiddhi',_A)
	def get_versions(A):return[_A]
	def _get_installer(A,version):return PySiddhiPackageInstaller()
class PySiddhiPackageInstaller(PackageInstaller):
	def __init__(A):super().__init__('pysiddhi',_A)
	def is_installed(B):
		try:from PySiddhi import SiddhiLoader as A;assert A;return True
		except ModuleNotFoundError:return False
	def _get_install_marker_path(A,install_dir):return install_dir
	def _install(B,target):
		if get_arch()!='amd64':raise SystemNotSupportedException('kinesisanalytics with siddhi is only supported on amd64')
		A=f"pip install {PYSIDDHI_PIP_DL_URL}";run(A)
class SiddhiSdkPackage(Package):
	def __init__(A):super().__init__('SiddhiSdk',SIDDHI_SDK_VERSION)
	def get_versions(A):return[SIDDHI_SDK_VERSION]
	def _get_installer(A,version):return SiddhiSdkPackageInstaller(version)
class SiddhiSdkPackageInstaller(ArchiveDownloadAndExtractInstaller):
	def __init__(A,version):super().__init__(_B,version)
	def _get_install_marker_path(A,install_dir):return os.path.join(install_dir,A._get_archive_subdir())
	def _get_download_url(A):return SIDDHI_SDK_URL.format(version=A.version)
	def _get_archive_subdir(A):return f"siddhi-sdk-{A.version}"
	def _post_process(B,target):
		A='SIDDHISDK_HOME'
		if not os.environ.get(A):os.environ[A]=B.get_installed_dir()
class SiddhiPythonApiProxyPackage(Package):
	def __init__(A):super().__init__('SiddhiPythonApiProxy','5.1.0')
	def get_versions(A):return['5.1.0']
	def _get_installer(A,version):return SiddhiPythonApiProxyPackageInstaller('siddhi-python-api-proxy',version)
class SiddhiPythonApiProxyPackageInstaller(DownloadInstaller):
	def _get_install_dir(A,target):return os.path.join(target.value,_B,SIDDHI_SDK_VERSION,f"siddhi-sdk-{SIDDHI_SDK_VERSION}",'lib')
	def _get_download_url(A):return SIDDHI_PY_URL.format(version=A.version)
class SiddhiPackage(Package):
	def __init__(A):super().__init__('Siddhi SDK',SIDDHI_SDK_VERSION)
	def get_versions(A):return[SIDDHI_SDK_VERSION]
	def _get_installer(A,version):return SiddhiPackageInstaller()
class SiddhiPackageInstaller(MultiPackageInstaller):
	def __init__(A):super().__init__('siddhi',SIDDHI_SDK_VERSION,[SiddhiSdkPackage().get_installer(),SiddhiPythonApiProxyPackage().get_installer(),PySiddhiPackage().get_installer()])
siddhi_package=SiddhiPackage()