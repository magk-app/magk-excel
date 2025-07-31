_A='latest'
import logging,os.path,platform
from typing import List
from localstack.constants import ARTIFACTS_REPO
from localstack.packages import InstallTarget,Package,PackageInstaller
from localstack.packages.core import ArchiveDownloadAndExtractInstaller
from localstack.utils.platform import get_arch
ARTIFACTS_FALLBACK_URL='https://cdn.jsdelivr.net/gh/localstack/localstack-artifacts'
REGISTRY_ZIP_URL_DOCKER=f"{ARTIFACTS_REPO}/raw/1cc593407191bb24f859a718cd9ed884363b4a57/docker-registry/registry.<arch>.zip"
REGISTRY_ZIP_URL_FALLBACK=f"{ARTIFACTS_FALLBACK_URL}/docker-registry/registry.<arch>.zip"
LOG=logging.getLogger(__name__)
class RegistryPackage(Package):
	def __init__(A):super().__init__('DockerRegistry',_A)
	def get_versions(A):return[_A]
	def _get_installer(A,version):return RegistryPackageInstaller('docker-registry',version)
class RegistryPackageInstaller(ArchiveDownloadAndExtractInstaller):
	def _get_install_marker_path(B,install_dir):A=f"{platform.system().lower()}-{get_arch()}";return os.path.join(install_dir,f"registry.{A}")
	def _get_download_url(C):
		B='<arch>';A=f"{platform.system().lower()}-{get_arch()}"
		if C.use_fallback:return REGISTRY_ZIP_URL_FALLBACK.replace(B,A)
		else:return REGISTRY_ZIP_URL_DOCKER.replace(B,A)
	def _install(A,target):
		B=target
		try:A.use_fallback=False;super()._install(B)
		except Exception as C:D=A._get_download_url();A.use_fallback=True;E=A._get_download_url();LOG.info('Unable to fetch %s - using fallback URL %s: %s',D,E,C);super()._install(B)
registry_package=RegistryPackage()