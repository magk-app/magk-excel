_C='hadoop'
_B='true'
_A='{s3_endpoint}'
import glob,os
from typing import List
from localstack import config
from localstack.constants import MAVEN_REPO_URL,TEST_AWS_ACCESS_KEY_ID,TEST_AWS_SECRET_ACCESS_KEY
from localstack.packages import InstallTarget,Package
from localstack.packages.core import ArchiveDownloadAndExtractInstaller
from localstack.utils.files import file_exists_not_empty,rm_rf,save_file
from localstack.utils.http import download
from localstack_ext.packages.cve_fixes import HTRACE_NOOP_JAR_URL,CVEFix,FixStrategyDelete,FixStrategyDownloadFile,fix_cves_in_jar_files
from localstack_ext.packages.spark import AWS_SDK_VER
URL_PATTERN_HADOOP='https://downloads.apache.org/hadoop/common/hadoop-{version}/hadoop-{version}.tar.gz'
AWS_SDK_BUNDLE_JAR=f"aws-java-sdk-bundle-{AWS_SDK_VER}.jar"
AWS_SDK_BUNDLE_JAR_URL=f"{MAVEN_REPO_URL}/com/amazonaws/aws-java-sdk-bundle/{AWS_SDK_VER}/{AWS_SDK_BUNDLE_JAR}"
HADOOP_DEFAULT_VERSION='3.3.1'
HADOOP_VERSIONS=['2.10.2','3.3.1']
HADOOP_FS_S3_PROPS={'fs.s3.awsAccessKeyId':TEST_AWS_ACCESS_KEY_ID,'fs.s3.awsSecretAccessKey':TEST_AWS_SECRET_ACCESS_KEY,'fs.s3.endpoint':_A,'fs.s3.path.style.access':_B,'fs.s3a.awsAccessKeyId':TEST_AWS_ACCESS_KEY_ID,'fs.s3a.awsSecretAccessKey':TEST_AWS_SECRET_ACCESS_KEY,'fs.s3a.access.key':TEST_AWS_ACCESS_KEY_ID,'fs.s3a.secret.key':TEST_AWS_SECRET_ACCESS_KEY,'fs.s3a.endpoint':_A,'fs.s3a.path.style.access':_B,'fs.s3n.awsAccessKeyId':TEST_AWS_ACCESS_KEY_ID,'fs.s3n.awsSecretAccessKey':TEST_AWS_SECRET_ACCESS_KEY,'fs.s3n.endpoint':_A,'fs.s3n.path.style.access':_B}
class HadoopInstaller(ArchiveDownloadAndExtractInstaller):
	def __init__(A,version):super().__init__(name=_C,version=version,extract_single_directory=True)
	def _get_download_url(A):return URL_PATTERN_HADOOP.format(version=A.version)
	def _get_install_marker_path(A,install_dir):return os.path.join(install_dir,'bin',_C)
	def get_hadoop_home(A):return get_hadoop_home_in_container(A.version)
	def _post_process(B,target):
		C=B.get_hadoop_home();A='\n'.join(f"<property><name>{A}</name><value>{B}</value></property>"for(A,B)in HADOOP_FS_S3_PROPS.items());G=config.external_service_url();A=A.format(s3_endpoint=G);H=f"""
          <configuration>
            <property>
              <name>fs.defaultFS</name>
              <value>file://{config.TMP_FOLDER}/hadoop-fs</value>
            </property>
            <property>
              <name>fs.default.name</name>
              <value>file://{config.TMP_FOLDER}/hadoop-fs</value>
            </property>
            {A}
          </configuration>
        """;save_file(os.path.join(C,'etc/hadoop/core-site.xml'),H);D=os.path.join(C,'share/hadoop/tools/lib');E=glob.glob(os.path.join(D,'aws-java-sdk-*.jar'))
		for I in E:rm_rf(I)
		if E:
			F=os.path.join(D,AWS_SDK_BUNDLE_JAR)
			if not file_exists_not_empty(F):download(AWS_SDK_BUNDLE_JAR_URL,F)
		B._apply_cve_fixes(target)
	def _apply_cve_fixes(D,target):A=target;B=CVEFix(paths=['hadoop/3.3.1/share/hadoop/common/lib/htrace-core4-4.1.0-incubating.jar','hadoop/3.3.1/share/hadoop/hdfs/lib/htrace-core4-4.1.0-incubating.jar','hadoop/3.3.1/share/hadoop/yarn/hadoop-yarn-applications-catalog-webapp-3.3.1.war:WEB-INF/lib/htrace-core4-4.1.0-incubating.jar','hadoop/3.3.1/share/hadoop/yarn/timelineservice/lib/htrace-core-3.1.0-incubating.jar'],strategy=FixStrategyDelete());C=CVEFix(paths=['hadoop/3.3.1/share/hadoop/client/hadoop-client-api-3.3.1.jar'],strategy=FixStrategyDownloadFile(file_url=HTRACE_NOOP_JAR_URL,target_path=os.path.join(A.value,'hadoop/3.3.1/share/hadoop/common')));fix_cves_in_jar_files(A,fixes=[B,C])
class HadoopPackage(Package):
	def __init__(A,default_version=HADOOP_DEFAULT_VERSION):super().__init__(name='Hadoop',default_version=default_version)
	def get_versions(A):return HADOOP_VERSIONS
	def _get_installer(A,version):return HadoopInstaller(version)
hadoop_package=HadoopPackage()
def get_hadoop_home_in_container(hadoop_version=None):
	B=hadoop_version;B=B or HADOOP_DEFAULT_VERSION;D=hadoop_package.get_installer(B);A=D.get_installed_dir();C=os.listdir(A)
	if len(C)==1:A=os.path.join(A,C[0])
	E=os.path.join(A,'bin/hadoop')
	if not os.path.exists(E):raise Exception(f"Hadoop not fully installed in directory {A}")
	return A