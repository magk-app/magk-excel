_A='latest'
import logging
from typing import List
import distro
from localstack.constants import ARTIFACTS_REPO
from localstack.packages import Package,PackageInstaller
from localstack.packages.core import NodePackageInstaller,PermissionDownloadInstaller
from localstack.utils.platform import get_arch
LOG=logging.getLogger(__name__)
RULE_ENGINE_INSTALL_URL='https://github.com/whummer/serverless-iot-offline'
MOSQUITTO_DIST_URL=ARTIFACTS_REPO+'/raw/8ed0945a2a9c92afd89b5c5ec326dc5ab771e685/mosquitto/{os_codename}/v{version}/{platform}/mosquitto'
class MosquittoPackage(Package):
	def __init__(A):super().__init__('Mosquitto',f"2.0.12-{distro.codename()}")
	def get_versions(A):return[f"2.0.12-{distro.codename()}"]
	def _get_installer(A,version):return MosquittoPackageInstaller(version)
class MosquittoPackageInstaller(PermissionDownloadInstaller):
	def __init__(A,version):super().__init__('mosquitto',version)
	def _get_download_url(A):B,C=A.version.split('-');return MOSQUITTO_DIST_URL.format(version=B,platform=get_arch(),os_codename=C)
class IoTRuleEnginePackage(Package):
	def __init__(A):super().__init__('IoTRuleEngine',_A)
	def get_versions(A):return[_A]
	def _get_installer(A,version):return IoTRuleEnginePackageInstaller(version=version)
class IoTRuleEnginePackageInstaller(NodePackageInstaller):
	def __init__(A,version):super().__init__(package_name='serverless-iot-offline',package_spec=RULE_ENGINE_INSTALL_URL,version=version,main_module='query.js')
iot_rule_engine_package=IoTRuleEnginePackage()
mosquitto_package=MosquittoPackage()