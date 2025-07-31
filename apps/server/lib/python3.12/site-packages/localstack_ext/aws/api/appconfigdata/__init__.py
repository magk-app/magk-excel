from typing import IO, Dict, Iterable, Optional, TypedDict, Union

from localstack.aws.api import RequestContext, ServiceException, ServiceRequest, handler

Identifier = str
Integer = int
OptionalPollSeconds = int
String = str
Token = str


class BadRequestReason(str):
    InvalidParameters = "InvalidParameters"


class InvalidParameterProblem(str):
    Corrupted = "Corrupted"
    Expired = "Expired"
    PollIntervalNotSatisfied = "PollIntervalNotSatisfied"


class ResourceType(str):
    Application = "Application"
    ConfigurationProfile = "ConfigurationProfile"
    Deployment = "Deployment"
    Environment = "Environment"
    Configuration = "Configuration"


class InvalidParameterDetail(TypedDict, total=False):
    """Information about an invalid parameter."""

    Problem: Optional[InvalidParameterProblem]


InvalidParameterMap = Dict[String, InvalidParameterDetail]


class BadRequestDetails(TypedDict, total=False):
    """Detailed information about the input that failed to satisfy the
    constraints specified by a call.
    """

    InvalidParameters: Optional[InvalidParameterMap]


class BadRequestException(ServiceException):
    """The input fails to satisfy the constraints specified by the service."""

    code: str = "BadRequestException"
    sender_fault: bool = True
    status_code: int = 400
    Reason: Optional[BadRequestReason]
    Details: Optional[BadRequestDetails]


class InternalServerException(ServiceException):
    """There was an internal failure in the service."""

    code: str = "InternalServerException"
    sender_fault: bool = False
    status_code: int = 500


StringMap = Dict[String, String]


class ResourceNotFoundException(ServiceException):
    """The requested resource could not be found."""

    code: str = "ResourceNotFoundException"
    sender_fault: bool = True
    status_code: int = 404
    ResourceType: Optional[ResourceType]
    ReferencedBy: Optional[StringMap]


class ThrottlingException(ServiceException):
    """The request was denied due to request throttling."""

    code: str = "ThrottlingException"
    sender_fault: bool = True
    status_code: int = 429


class GetLatestConfigurationRequest(ServiceRequest):
    ConfigurationToken: Token


SensitiveBlob = bytes


class GetLatestConfigurationResponse(TypedDict, total=False):
    Configuration: Optional[Union[SensitiveBlob, IO[SensitiveBlob], Iterable[SensitiveBlob]]]
    NextPollConfigurationToken: Optional[Token]
    NextPollIntervalInSeconds: Optional[Integer]
    ContentType: Optional[String]
    VersionLabel: Optional[String]


class StartConfigurationSessionRequest(ServiceRequest):
    ApplicationIdentifier: Identifier
    EnvironmentIdentifier: Identifier
    ConfigurationProfileIdentifier: Identifier
    RequiredMinimumPollIntervalInSeconds: Optional[OptionalPollSeconds]


class StartConfigurationSessionResponse(TypedDict, total=False):
    InitialConfigurationToken: Optional[Token]


class AppconfigdataApi:
    service = "appconfigdata"
    version = "2021-11-11"

    @handler("GetLatestConfiguration")
    def get_latest_configuration(
        self, context: RequestContext, configuration_token: Token
    ) -> GetLatestConfigurationResponse:
        """Retrieves the latest deployed configuration. This API may return empty
        configuration data if the client already has the latest version. For
        more information about this API action and to view example CLI commands
        that show how to use it with the StartConfigurationSession API action,
        see `Retrieving the
        configuration <http://docs.aws.amazon.com/appconfig/latest/userguide/appconfig-retrieving-the-configuration>`__
        in the *AppConfig User Guide*.

        Note the following important information.

        -  Each configuration token is only valid for one call to
           ``GetLatestConfiguration``. The ``GetLatestConfiguration`` response
           includes a ``NextPollConfigurationToken`` that should always replace
           the token used for the just-completed call in preparation for the
           next one.

        -  ``GetLatestConfiguration`` is a priced call. For more information,
           see `Pricing <https://aws.amazon.com/systems-manager/pricing/>`__.

        :param configuration_token: Token describing the current state of the configuration session.
        :returns: GetLatestConfigurationResponse
        :raises ThrottlingException:
        :raises ResourceNotFoundException:
        :raises BadRequestException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("StartConfigurationSession")
    def start_configuration_session(
        self,
        context: RequestContext,
        application_identifier: Identifier,
        environment_identifier: Identifier,
        configuration_profile_identifier: Identifier,
        required_minimum_poll_interval_in_seconds: OptionalPollSeconds = None,
    ) -> StartConfigurationSessionResponse:
        """Starts a configuration session used to retrieve a deployed
        configuration. For more information about this API action and to view
        example CLI commands that show how to use it with the
        GetLatestConfiguration API action, see `Retrieving the
        configuration <http://docs.aws.amazon.com/appconfig/latest/userguide/appconfig-retrieving-the-configuration>`__
        in the *AppConfig User Guide*.

        :param application_identifier: The application ID or the application name.
        :param environment_identifier: The environment ID or the environment name.
        :param configuration_profile_identifier: The configuration profile ID or the configuration profile name.
        :param required_minimum_poll_interval_in_seconds: Sets a constraint on a session.
        :returns: StartConfigurationSessionResponse
        :raises ThrottlingException:
        :raises ResourceNotFoundException:
        :raises BadRequestException:
        :raises InternalServerException:
        """
        raise NotImplementedError
