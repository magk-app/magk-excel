_A='latest'
from typing import List
from localstack.packages import InstallTarget,Package,PackageInstaller
from localstack_ext.packages import OSPackageInstaller
class RedisPackage(Package):
	def __init__(A):super().__init__('Redis',_A)
	def get_versions(A):return[_A]
	def _get_installer(A,version):return RedisPackageInstaller(version)
class RedisPackageInstaller(OSPackageInstaller):
	def __init__(A,version):super().__init__('redis',version)
	def _debian_get_install_dir(A,target):return'/etc/redis'
	def _debian_get_install_marker_path(A,install_dir):return'/usr/bin/redis-server'
	def _debian_packages(A):return['redis-server']
redis_package=RedisPackage()