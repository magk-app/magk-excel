import logging,os,re
from typing import List,Optional
from localstack.constants import MAVEN_REPO_URL
from localstack.packages import InstallTarget,Package,PackageInstaller
from localstack.services.stepfunctions.packages import JAR_URLS,SFN_PATCH_URL_PREFIX,stepfunctions_local_package
from localstack.utils.archives import add_file_to_jar,update_jar_manifest
from localstack.utils.files import file_exists_not_empty
from localstack.utils.http import download
from localstack.utils.run import run
LOG=logging.getLogger(__name__)
SFN_PATCH_PRO_CLASS1='cloud/localstack/PersistenceAspect.class'
SFN_PATCH_PRO_CLASS2='cloud/localstack/PersistenceContext.class'
SFN_PATCH_PRO_CLASS3='cloud/localstack/PersistenceState.class'
SFN_PATCH_PRO_CLASS4='cloud/localstack/PersistenceRegionState.class'
SFN_PATCH_PRO_FILE_METAINF='META-INF/aop-pro.xml'
URL_KRYO=f"{MAVEN_REPO_URL}/com/esotericsoftware/kryo/5.2.0/kryo-5.2.0.jar"
URL_OBJENESIS=f"{MAVEN_REPO_URL}/org/objenesis/objenesis/3.2/objenesis-3.2.jar"
URL_MINLOG=f"{MAVEN_REPO_URL}/com/esotericsoftware/minlog/1.3.1/minlog-1.3.1.jar"
URL_REFLECTASM=f"{MAVEN_REPO_URL}/com/esotericsoftware/reflectasm/1.11.9/reflectasm-1.11.9.jar"
PRO_JAR_URLS=[URL_KRYO,URL_OBJENESIS,URL_MINLOG,URL_REFLECTASM]
class StepFunctionsProPackage(Package):
	def __init__(A):super().__init__('StepFunctionsLocal','1.7.9')
	def get_versions(A):return['1.7.9']
	def _get_installer(A,version):return StepFunctionsProPackageInstaller('stepfunctions-local',version)
class StepFunctionsProPackageInstaller(PackageInstaller):
	def is_installed(G):
		B=False
		if not stepfunctions_local_package.get_installer().is_installed():return B
		A=stepfunctions_local_package.get_installer().get_executable_path();C=os.path.dirname(A);D=run(['zip','-sf',A],cwd=C);E=[SFN_PATCH_PRO_CLASS1,SFN_PATCH_PRO_CLASS2,SFN_PATCH_PRO_CLASS3,SFN_PATCH_PRO_CLASS4,SFN_PATCH_PRO_FILE_METAINF]
		for F in E:
			if F not in D:LOG.debug('At least one class is currently not present in the jar');return B
		return True
	def _get_install_marker_path(A,install_dir):return stepfunctions_local_package.get_installer()._get_install_marker_path(install_dir)
	def install(B,target=None):
		A=target
		if not stepfunctions_local_package.get_installer().is_installed():stepfunctions_local_package.install(target=A)
		super().install(A)
	def _install(K,target):
		F='StepFunctionsLocal.jar';A=target;C=stepfunctions_local_package.get_installer();B=C.get_installed_dir();G=C.get_executable_path();H=[SFN_PATCH_PRO_CLASS1,SFN_PATCH_PRO_CLASS2,SFN_PATCH_PRO_CLASS3,SFN_PATCH_PRO_CLASS4,SFN_PATCH_PRO_FILE_METAINF]
		for D in H:I=f"{SFN_PATCH_URL_PREFIX}/{D}";add_file_to_jar(D,I,target_jar=G)
		update_jar_manifest(F,B,re.compile('Main-Class: com\\.amazonaws.+'),'Main-Class: cloud.localstack.StepFunctionsStarter');J=' '.join([os.path.basename(A)for A in[*PRO_JAR_URLS,*JAR_URLS]]);update_jar_manifest(F,B,re.compile('Class-Path: .+ \\. '),f"Class-Path: {J} . ")
		for E in PRO_JAR_URLS:
			A=os.path.join(B,os.path.basename(E))
			if not file_exists_not_empty(A):download(E,A)
stepfunctions_pro_package=StepFunctionsProPackage()