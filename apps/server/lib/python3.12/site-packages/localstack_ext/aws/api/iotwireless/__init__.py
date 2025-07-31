from datetime import datetime
from typing import IO, Iterable, List, Optional, TypedDict, Union

from localstack.aws.api import RequestContext, ServiceException, ServiceRequest, handler

AccountLinked = bool
AckModeRetryDurationSecs = int
AddGwMetadata = bool
AmazonId = str
AmazonResourceName = str
ApId = str
AppEui = str
AppKey = str
AppSKey = str
AppServerPrivateKey = str
ApplicationServerPublicKey = str
AutoCreateTasks = bool
BCCH = int
BSIC = int
BaseLat = float
BaseLng = float
BaseStationId = int
BeaconingDataRate = int
BeaconingFrequency = int
CaptureTimeAccuracy = float
CdmaChannel = int
CellParams = int
CertificatePEM = str
CertificateValue = str
ChannelMask = str
ClassBTimeout = int
ClassCTimeout = int
ClientRequestToken = str
Coordinate = float
DakCertificateId = str
Description = str
DestinationArn = str
DestinationName = str
DevAddr = str
DevEui = str
DevStatusReqFreq = int
DeviceCreationFile = str
DeviceName = str
DeviceProfileArn = str
DeviceProfileId = str
DeviceProfileName = str
DeviceTypeId = str
DlBucketSize = int
DlDr = int
DlFreq = int
DlRate = int
DlRatePolicy = str
Double = float
DownlinkFrequency = int
DrMax = int
DrMaxBox = int
DrMin = int
DrMinBox = int
EARFCN = int
EndPoint = str
EutranCid = int
Expression = str
FCntStart = int
FNwkSIntKey = str
FPort = int
FactorySupport = bool
Fingerprint = str
FirmwareUpdateImage = str
FirmwareUpdateRole = str
FragmentIntervalMS = int
FragmentSizeBytes = int
FuotaTaskArn = str
FuotaTaskId = str
FuotaTaskName = str
GPST = float
GatewayEui = str
GatewayMaxEirp = float
GenAppKey = str
GeranCid = int
GnssNav = str
GsmTimingAdvance = int
HorizontalAccuracy = float
HrAllowed = bool
IPAddress = str
ISODateTimeString = str
Identifier = str
ImportTaskArn = str
ImportTaskId = str
Integer = int
IotCertificateId = str
JoinEui = str
LAC = int
LteTimingAdvance = int
MCC = int
MNC = int
MacAddress = str
MacVersion = str
MaxAllowedSignature = int
MaxDutyCycle = int
MaxEirp = int
MaxResults = int
McGroupId = int
Message = str
MessageId = str
MinGwDiversity = int
Model = str
MulticastDeviceStatus = str
MulticastGroupArn = str
MulticastGroupId = str
MulticastGroupMessageId = str
MulticastGroupName = str
MulticastGroupStatus = str
NRCapable = bool
NetId = str
NetworkAnalyzerConfigurationArn = str
NetworkAnalyzerConfigurationName = str
NetworkId = int
NextToken = str
NumberOfDevicesInGroup = int
NumberOfDevicesRequested = int
NwkGeoLoc = bool
NwkKey = str
NwkSEncKey = str
NwkSKey = str
OnboardStatusReason = str
PCI = int
PSC = int
PackageVersion = str
PartnerAccountArn = str
PartnerAccountId = str
PathLoss = int
PayloadData = str
PilotPower = int
PingSlotDr = int
PingSlotFreq = int
PingSlotPeriod = int
PnOffset = int
PositionCoordinateValue = float
PositionResourceIdentifier = str
PositionSolverVersion = str
PrAllowed = bool
PresetFreq = int
QualificationStatus = bool
QueryString = str
RSCP = int
RSRP = int
RSRQ = float
RSS = int
RaAllowed = bool
RedundancyPercent = int
RegParamsRevision = str
RegistrationZone = int
ReportDevStatusBattery = bool
ReportDevStatusMargin = bool
ResourceId = str
ResourceIdentifier = str
ResourceType = str
Result = str
RfRegion = str
Role = str
RoleArn = str
RxDataRate2 = int
RxDelay1 = int
RxDrOffset1 = int
RxFreq2 = int
RxLevel = int
SNwkSIntKey = str
Seq = int
ServiceProfileArn = str
ServiceProfileId = str
ServiceProfileName = str
SessionTimeout = int
SidewalkId = str
SidewalkManufacturingSn = str
Station = str
StatusReason = str
SubBand = int
Supports32BitFCnt = bool
SupportsClassB = bool
SupportsClassC = bool
SupportsJoin = bool
SystemId = int
TAC = int
TagKey = str
TagValue = str
TargetPer = int
TdscdmaTimingAdvance = int
ThingArn = str
ThingName = str
TransmissionInterval = int
TransmitMode = int
UARFCN = int
UARFCNDL = int
UlBucketSize = int
UlRate = int
UlRatePolicy = str
UpdateDataSource = str
UpdateSignature = str
Use2DSolver = bool
UtranCid = int
VerticalAccuracy = float
WirelessDeviceArn = str
WirelessDeviceId = str
WirelessDeviceName = str
WirelessGatewayArn = str
WirelessGatewayId = str
WirelessGatewayName = str
WirelessGatewayTaskDefinitionArn = str
WirelessGatewayTaskDefinitionId = str
WirelessGatewayTaskName = str


class ApplicationConfigType(str):
    SemtechGeolocation = "SemtechGeolocation"


class BatteryLevel(str):
    normal = "normal"
    low = "low"
    critical = "critical"


class ConnectionStatus(str):
    Connected = "Connected"
    Disconnected = "Disconnected"


class DeviceProfileType(str):
    Sidewalk = "Sidewalk"
    LoRaWAN = "LoRaWAN"


class DeviceState(str):
    Provisioned = "Provisioned"
    RegisteredNotSeen = "RegisteredNotSeen"
    RegisteredReachable = "RegisteredReachable"
    RegisteredUnreachable = "RegisteredUnreachable"


class DlClass(str):
    ClassB = "ClassB"
    ClassC = "ClassC"


class DownlinkMode(str):
    SEQUENTIAL = "SEQUENTIAL"
    CONCURRENT = "CONCURRENT"
    USING_UPLINK_GATEWAY = "USING_UPLINK_GATEWAY"


class Event(str):
    discovered = "discovered"
    lost = "lost"
    ack = "ack"
    nack = "nack"
    passthrough = "passthrough"


class EventNotificationPartnerType(str):
    Sidewalk = "Sidewalk"


class EventNotificationResourceType(str):
    SidewalkAccount = "SidewalkAccount"
    WirelessDevice = "WirelessDevice"
    WirelessGateway = "WirelessGateway"


class EventNotificationTopicStatus(str):
    Enabled = "Enabled"
    Disabled = "Disabled"


class ExpressionType(str):
    RuleName = "RuleName"
    MqttTopic = "MqttTopic"


class FuotaDeviceStatus(str):
    Initial = "Initial"
    Package_Not_Supported = "Package_Not_Supported"
    FragAlgo_unsupported = "FragAlgo_unsupported"
    Not_enough_memory = "Not_enough_memory"
    FragIndex_unsupported = "FragIndex_unsupported"
    Wrong_descriptor = "Wrong_descriptor"
    SessionCnt_replay = "SessionCnt_replay"
    MissingFrag = "MissingFrag"
    MemoryError = "MemoryError"
    MICError = "MICError"
    Successful = "Successful"


class FuotaTaskStatus(str):
    Pending = "Pending"
    FuotaSession_Waiting = "FuotaSession_Waiting"
    In_FuotaSession = "In_FuotaSession"
    FuotaDone = "FuotaDone"
    Delete_Waiting = "Delete_Waiting"


class IdentifierType(str):
    PartnerAccountId = "PartnerAccountId"
    DevEui = "DevEui"
    GatewayEui = "GatewayEui"
    WirelessDeviceId = "WirelessDeviceId"
    WirelessGatewayId = "WirelessGatewayId"


class ImportTaskStatus(str):
    INITIALIZING = "INITIALIZING"
    INITIALIZED = "INITIALIZED"
    PENDING = "PENDING"
    COMPLETE = "COMPLETE"
    FAILED = "FAILED"
    DELETING = "DELETING"


class LogLevel(str):
    INFO = "INFO"
    ERROR = "ERROR"
    DISABLED = "DISABLED"


class MessageType(str):
    CUSTOM_COMMAND_ID_NOTIFY = "CUSTOM_COMMAND_ID_NOTIFY"
    CUSTOM_COMMAND_ID_GET = "CUSTOM_COMMAND_ID_GET"
    CUSTOM_COMMAND_ID_SET = "CUSTOM_COMMAND_ID_SET"
    CUSTOM_COMMAND_ID_RESP = "CUSTOM_COMMAND_ID_RESP"


class MulticastFrameInfo(str):
    ENABLED = "ENABLED"
    DISABLED = "DISABLED"


class OnboardStatus(str):
    INITIALIZED = "INITIALIZED"
    PENDING = "PENDING"
    ONBOARDED = "ONBOARDED"
    FAILED = "FAILED"


class PartnerType(str):
    Sidewalk = "Sidewalk"


class PositionConfigurationFec(str):
    ROSE = "ROSE"
    NONE = "NONE"


class PositionConfigurationStatus(str):
    Enabled = "Enabled"
    Disabled = "Disabled"


class PositionResourceType(str):
    WirelessDevice = "WirelessDevice"
    WirelessGateway = "WirelessGateway"


class PositionSolverProvider(str):
    Semtech = "Semtech"


class PositionSolverType(str):
    GNSS = "GNSS"


class PositioningConfigStatus(str):
    Enabled = "Enabled"
    Disabled = "Disabled"


class SigningAlg(str):
    Ed25519 = "Ed25519"
    P256r1 = "P256r1"


class SupportedRfRegion(str):
    EU868 = "EU868"
    US915 = "US915"
    AU915 = "AU915"
    AS923_1 = "AS923-1"
    AS923_2 = "AS923-2"
    AS923_3 = "AS923-3"
    AS923_4 = "AS923-4"
    EU433 = "EU433"
    CN470 = "CN470"
    CN779 = "CN779"
    RU864 = "RU864"
    KR920 = "KR920"
    IN865 = "IN865"


class WirelessDeviceEvent(str):
    Join = "Join"
    Rejoin = "Rejoin"
    Uplink_Data = "Uplink_Data"
    Downlink_Data = "Downlink_Data"
    Registration = "Registration"


class WirelessDeviceFrameInfo(str):
    ENABLED = "ENABLED"
    DISABLED = "DISABLED"


class WirelessDeviceIdType(str):
    WirelessDeviceId = "WirelessDeviceId"
    DevEui = "DevEui"
    ThingName = "ThingName"
    SidewalkManufacturingSn = "SidewalkManufacturingSn"


class WirelessDeviceSidewalkStatus(str):
    PROVISIONED = "PROVISIONED"
    REGISTERED = "REGISTERED"
    ACTIVATED = "ACTIVATED"
    UNKNOWN = "UNKNOWN"


class WirelessDeviceType(str):
    Sidewalk = "Sidewalk"
    LoRaWAN = "LoRaWAN"


class WirelessGatewayEvent(str):
    CUPS_Request = "CUPS_Request"
    Certificate = "Certificate"


class WirelessGatewayIdType(str):
    GatewayEui = "GatewayEui"
    WirelessGatewayId = "WirelessGatewayId"
    ThingName = "ThingName"


class WirelessGatewayServiceType(str):
    CUPS = "CUPS"
    LNS = "LNS"


class WirelessGatewayTaskDefinitionType(str):
    UPDATE = "UPDATE"


class WirelessGatewayTaskStatus(str):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    FIRST_RETRY = "FIRST_RETRY"
    SECOND_RETRY = "SECOND_RETRY"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class WirelessGatewayType(str):
    LoRaWAN = "LoRaWAN"


class AccessDeniedException(ServiceException):
    """User does not have permission to perform this action."""

    code: str = "AccessDeniedException"
    sender_fault: bool = False
    status_code: int = 403


class ConflictException(ServiceException):
    """Adding, updating, or deleting the resource can cause an inconsistent
    state.
    """

    code: str = "ConflictException"
    sender_fault: bool = False
    status_code: int = 409
    ResourceId: Optional[ResourceId]
    ResourceType: Optional[ResourceType]


class InternalServerException(ServiceException):
    """An unexpected error occurred while processing a request."""

    code: str = "InternalServerException"
    sender_fault: bool = False
    status_code: int = 500


class ResourceNotFoundException(ServiceException):
    """Resource does not exist."""

    code: str = "ResourceNotFoundException"
    sender_fault: bool = False
    status_code: int = 404
    ResourceId: Optional[ResourceId]
    ResourceType: Optional[ResourceType]


class ThrottlingException(ServiceException):
    """The request was denied because it exceeded the allowed API request rate."""

    code: str = "ThrottlingException"
    sender_fault: bool = False
    status_code: int = 429


class TooManyTagsException(ServiceException):
    """The request was denied because the resource can't have any more tags."""

    code: str = "TooManyTagsException"
    sender_fault: bool = False
    status_code: int = 400
    ResourceName: Optional[AmazonResourceName]


class ValidationException(ServiceException):
    """The input did not meet the specified constraints."""

    code: str = "ValidationException"
    sender_fault: bool = False
    status_code: int = 400


class SessionKeysAbpV1_0_x(TypedDict, total=False):
    """Session keys for ABP v1.1"""

    NwkSKey: Optional[NwkSKey]
    AppSKey: Optional[AppSKey]


class AbpV1_0_x(TypedDict, total=False):
    """ABP device object for LoRaWAN specification v1.0.x"""

    DevAddr: Optional[DevAddr]
    SessionKeys: Optional[SessionKeysAbpV1_0_x]
    FCntStart: Optional[FCntStart]


class SessionKeysAbpV1_1(TypedDict, total=False):
    """Session keys for ABP v1.1"""

    FNwkSIntKey: Optional[FNwkSIntKey]
    SNwkSIntKey: Optional[SNwkSIntKey]
    NwkSEncKey: Optional[NwkSEncKey]
    AppSKey: Optional[AppSKey]


class AbpV1_1(TypedDict, total=False):
    """ABP device object for LoRaWAN specification v1.1"""

    DevAddr: Optional[DevAddr]
    SessionKeys: Optional[SessionKeysAbpV1_1]
    FCntStart: Optional[FCntStart]


class Accuracy(TypedDict, total=False):
    """The accuracy of the estimated position in meters. An empty value
    indicates that no position data is available. A value of ‘0.0’ value
    indicates that position data is available. This data corresponds to the
    position information that you specified instead of the position computed
    by solver.
    """

    HorizontalAccuracy: Optional[HorizontalAccuracy]
    VerticalAccuracy: Optional[VerticalAccuracy]


class ApplicationConfig(TypedDict, total=False):
    """LoRaWAN application configuration, which can be used to perform
    geolocation.
    """

    FPort: Optional[FPort]
    Type: Optional[ApplicationConfigType]
    DestinationName: Optional[DestinationName]


Applications = List[ApplicationConfig]
AssistPosition = List[Coordinate]


class Tag(TypedDict, total=False):
    """A simple label consisting of a customer-defined key-value pair"""

    Key: TagKey
    Value: TagValue


TagList = List[Tag]


class SidewalkAccountInfo(TypedDict, total=False):
    """Information about a Sidewalk account."""

    AmazonId: Optional[AmazonId]
    AppServerPrivateKey: Optional[AppServerPrivateKey]


class AssociateAwsAccountWithPartnerAccountRequest(ServiceRequest):
    Sidewalk: SidewalkAccountInfo
    ClientRequestToken: Optional[ClientRequestToken]
    Tags: Optional[TagList]


class AssociateAwsAccountWithPartnerAccountResponse(TypedDict, total=False):
    Sidewalk: Optional[SidewalkAccountInfo]
    Arn: Optional[PartnerAccountArn]


class AssociateMulticastGroupWithFuotaTaskRequest(ServiceRequest):
    Id: FuotaTaskId
    MulticastGroupId: MulticastGroupId


class AssociateMulticastGroupWithFuotaTaskResponse(TypedDict, total=False):
    pass


class AssociateWirelessDeviceWithFuotaTaskRequest(ServiceRequest):
    Id: FuotaTaskId
    WirelessDeviceId: WirelessDeviceId


class AssociateWirelessDeviceWithFuotaTaskResponse(TypedDict, total=False):
    pass


class AssociateWirelessDeviceWithMulticastGroupRequest(ServiceRequest):
    Id: MulticastGroupId
    WirelessDeviceId: WirelessDeviceId


class AssociateWirelessDeviceWithMulticastGroupResponse(TypedDict, total=False):
    pass


class AssociateWirelessDeviceWithThingRequest(ServiceRequest):
    Id: WirelessDeviceId
    ThingArn: ThingArn


class AssociateWirelessDeviceWithThingResponse(TypedDict, total=False):
    pass


class AssociateWirelessGatewayWithCertificateRequest(ServiceRequest):
    Id: WirelessGatewayId
    IotCertificateId: IotCertificateId


class AssociateWirelessGatewayWithCertificateResponse(TypedDict, total=False):
    IotCertificateId: Optional[IotCertificateId]


class AssociateWirelessGatewayWithThingRequest(ServiceRequest):
    Id: WirelessGatewayId
    ThingArn: ThingArn


class AssociateWirelessGatewayWithThingResponse(TypedDict, total=False):
    pass


BeaconingFrequencies = List[BeaconingFrequency]


class Beaconing(TypedDict, total=False):
    """Beaconing parameters for configuring the wireless gateways."""

    DataRate: Optional[BeaconingDataRate]
    Frequencies: Optional[BeaconingFrequencies]


class CancelMulticastGroupSessionRequest(ServiceRequest):
    Id: MulticastGroupId


class CancelMulticastGroupSessionResponse(TypedDict, total=False):
    pass


class CdmaNmrObj(TypedDict, total=False):
    """CDMA object for network measurement reports."""

    PnOffset: PnOffset
    CdmaChannel: CdmaChannel
    PilotPower: Optional[PilotPower]
    BaseStationId: Optional[BaseStationId]


CdmaNmrList = List[CdmaNmrObj]


class CdmaLocalId(TypedDict, total=False):
    """CDMA local ID information, which corresponds to the local identification
    parameters of a CDMA cell.
    """

    PnOffset: PnOffset
    CdmaChannel: CdmaChannel


class CdmaObj(TypedDict, total=False):
    """CDMA (Code-division multiple access) object."""

    SystemId: SystemId
    NetworkId: NetworkId
    BaseStationId: BaseStationId
    RegistrationZone: Optional[RegistrationZone]
    CdmaLocalId: Optional[CdmaLocalId]
    PilotPower: Optional[PilotPower]
    BaseLat: Optional[BaseLat]
    BaseLng: Optional[BaseLng]
    CdmaNmr: Optional[CdmaNmrList]


CdmaList = List[CdmaObj]


class LteNmrObj(TypedDict, total=False):
    """LTE object for network measurement reports."""

    Pci: PCI
    Earfcn: EARFCN
    EutranCid: EutranCid
    Rsrp: Optional[RSRP]
    Rsrq: Optional[RSRQ]


LteNmrList = List[LteNmrObj]


class LteLocalId(TypedDict, total=False):
    """LTE local identification (local ID) information."""

    Pci: PCI
    Earfcn: EARFCN


class LteObj(TypedDict, total=False):
    """LTE object."""

    Mcc: MCC
    Mnc: MNC
    EutranCid: EutranCid
    Tac: Optional[TAC]
    LteLocalId: Optional[LteLocalId]
    LteTimingAdvance: Optional[LteTimingAdvance]
    Rsrp: Optional[RSRP]
    Rsrq: Optional[RSRQ]
    NrCapable: Optional[NRCapable]
    LteNmr: Optional[LteNmrList]


LteList = List[LteObj]


class TdscdmaNmrObj(TypedDict, total=False):
    """TD-SCDMA object for network measurement reports."""

    Uarfcn: UARFCN
    CellParams: CellParams
    UtranCid: Optional[UtranCid]
    Rscp: Optional[RSCP]
    PathLoss: Optional[PathLoss]


TdscdmaNmrList = List[TdscdmaNmrObj]


class TdscdmaLocalId(TypedDict, total=False):
    """TD-SCDMA local identification (local Id) information."""

    Uarfcn: UARFCN
    CellParams: CellParams


class TdscdmaObj(TypedDict, total=False):
    """TD-SCDMA object."""

    Mcc: MCC
    Mnc: MNC
    Lac: Optional[LAC]
    UtranCid: UtranCid
    TdscdmaLocalId: Optional[TdscdmaLocalId]
    TdscdmaTimingAdvance: Optional[TdscdmaTimingAdvance]
    Rscp: Optional[RSCP]
    PathLoss: Optional[PathLoss]
    TdscdmaNmr: Optional[TdscdmaNmrList]


TdscdmaList = List[TdscdmaObj]


class WcdmaNmrObj(TypedDict, total=False):
    """Network Measurement Reports."""

    Uarfcndl: UARFCNDL
    Psc: PSC
    UtranCid: UtranCid
    Rscp: Optional[RSCP]
    PathLoss: Optional[PathLoss]


WcdmaNmrList = List[WcdmaNmrObj]


class WcdmaLocalId(TypedDict, total=False):
    """WCDMA local identification (local ID) information."""

    Uarfcndl: UARFCNDL
    Psc: PSC


class WcdmaObj(TypedDict, total=False):
    """WCDMA."""

    Mcc: MCC
    Mnc: MNC
    Lac: Optional[LAC]
    UtranCid: UtranCid
    WcdmaLocalId: Optional[WcdmaLocalId]
    Rscp: Optional[RSCP]
    PathLoss: Optional[PathLoss]
    WcdmaNmr: Optional[WcdmaNmrList]


WcdmaList = List[WcdmaObj]


class GlobalIdentity(TypedDict, total=False):
    """Global identity information."""

    Lac: LAC
    GeranCid: GeranCid


class GsmNmrObj(TypedDict, total=False):
    """GSM object for network measurement reports."""

    Bsic: BSIC
    Bcch: BCCH
    RxLevel: Optional[RxLevel]
    GlobalIdentity: Optional[GlobalIdentity]


GsmNmrList = List[GsmNmrObj]


class GsmLocalId(TypedDict, total=False):
    """GSM local ID information, which corresponds to the local identification
    parameters of a GSM cell.
    """

    Bsic: BSIC
    Bcch: BCCH


class GsmObj(TypedDict, total=False):
    """GSM object."""

    Mcc: MCC
    Mnc: MNC
    Lac: LAC
    GeranCid: GeranCid
    GsmLocalId: Optional[GsmLocalId]
    GsmTimingAdvance: Optional[GsmTimingAdvance]
    RxLevel: Optional[RxLevel]
    GsmNmr: Optional[GsmNmrList]


GsmList = List[GsmObj]


class CellTowers(TypedDict, total=False):
    """The cell towers that were used to perform the measurements."""

    Gsm: Optional[GsmList]
    Wcdma: Optional[WcdmaList]
    Tdscdma: Optional[TdscdmaList]
    Lte: Optional[LteList]
    Cdma: Optional[CdmaList]


class CertificateList(TypedDict, total=False):
    """List of sidewalk certificates."""

    SigningAlg: SigningAlg
    Value: CertificateValue


class LoRaWANConnectionStatusEventNotificationConfigurations(TypedDict, total=False):
    """Object for LoRaWAN connection status resource type event configuration."""

    GatewayEuiEventTopic: Optional[EventNotificationTopicStatus]


class ConnectionStatusEventConfiguration(TypedDict, total=False):
    """Connection status event configuration object for enabling or disabling
    topic.
    """

    LoRaWAN: Optional[LoRaWANConnectionStatusEventNotificationConfigurations]
    WirelessGatewayIdEventTopic: Optional[EventNotificationTopicStatus]


class LoRaWANConnectionStatusResourceTypeEventConfiguration(TypedDict, total=False):
    """Object for LoRaWAN connection status resource type event configuration."""

    WirelessGatewayEventTopic: Optional[EventNotificationTopicStatus]


class ConnectionStatusResourceTypeEventConfiguration(TypedDict, total=False):
    """Connection status resource type event configuration object for enabling
    or disabling topic.
    """

    LoRaWAN: Optional[LoRaWANConnectionStatusResourceTypeEventConfiguration]


Crc = int


class CreateDestinationRequest(ServiceRequest):
    Name: DestinationName
    ExpressionType: ExpressionType
    Expression: Expression
    Description: Optional[Description]
    RoleArn: RoleArn
    Tags: Optional[TagList]
    ClientRequestToken: Optional[ClientRequestToken]


class CreateDestinationResponse(TypedDict, total=False):
    Arn: Optional[DestinationArn]
    Name: Optional[DestinationName]


class SidewalkCreateDeviceProfile(TypedDict, total=False):
    """Sidewalk object for creating a device profile."""

    pass


FactoryPresetFreqsList = List[PresetFreq]


class LoRaWANDeviceProfile(TypedDict, total=False):
    """LoRaWANDeviceProfile object."""

    SupportsClassB: Optional[SupportsClassB]
    ClassBTimeout: Optional[ClassBTimeout]
    PingSlotPeriod: Optional[PingSlotPeriod]
    PingSlotDr: Optional[PingSlotDr]
    PingSlotFreq: Optional[PingSlotFreq]
    SupportsClassC: Optional[SupportsClassC]
    ClassCTimeout: Optional[ClassCTimeout]
    MacVersion: Optional[MacVersion]
    RegParamsRevision: Optional[RegParamsRevision]
    RxDelay1: Optional[RxDelay1]
    RxDrOffset1: Optional[RxDrOffset1]
    RxDataRate2: Optional[RxDataRate2]
    RxFreq2: Optional[RxFreq2]
    FactoryPresetFreqsList: Optional[FactoryPresetFreqsList]
    MaxEirp: Optional[MaxEirp]
    MaxDutyCycle: Optional[MaxDutyCycle]
    RfRegion: Optional[RfRegion]
    SupportsJoin: Optional[SupportsJoin]
    Supports32BitFCnt: Optional[Supports32BitFCnt]


class CreateDeviceProfileRequest(ServiceRequest):
    Name: Optional[DeviceProfileName]
    LoRaWAN: Optional[LoRaWANDeviceProfile]
    Tags: Optional[TagList]
    ClientRequestToken: Optional[ClientRequestToken]
    Sidewalk: Optional[SidewalkCreateDeviceProfile]


class CreateDeviceProfileResponse(TypedDict, total=False):
    Arn: Optional[DeviceProfileArn]
    Id: Optional[DeviceProfileId]


class LoRaWANFuotaTask(TypedDict, total=False):
    """The LoRaWAN information used with a FUOTA task."""

    RfRegion: Optional[SupportedRfRegion]


class CreateFuotaTaskRequest(ServiceRequest):
    Name: Optional[FuotaTaskName]
    Description: Optional[Description]
    ClientRequestToken: Optional[ClientRequestToken]
    LoRaWAN: Optional[LoRaWANFuotaTask]
    FirmwareUpdateImage: FirmwareUpdateImage
    FirmwareUpdateRole: FirmwareUpdateRole
    Tags: Optional[TagList]
    RedundancyPercent: Optional[RedundancyPercent]
    FragmentSizeBytes: Optional[FragmentSizeBytes]
    FragmentIntervalMS: Optional[FragmentIntervalMS]


class CreateFuotaTaskResponse(TypedDict, total=False):
    Arn: Optional[FuotaTaskArn]
    Id: Optional[FuotaTaskId]


class LoRaWANMulticast(TypedDict, total=False):
    """The LoRaWAN information that is to be used with the multicast group."""

    RfRegion: Optional[SupportedRfRegion]
    DlClass: Optional[DlClass]


class CreateMulticastGroupRequest(ServiceRequest):
    Name: Optional[MulticastGroupName]
    Description: Optional[Description]
    ClientRequestToken: Optional[ClientRequestToken]
    LoRaWAN: LoRaWANMulticast
    Tags: Optional[TagList]


class CreateMulticastGroupResponse(TypedDict, total=False):
    Arn: Optional[MulticastGroupArn]
    Id: Optional[MulticastGroupId]


NetworkAnalyzerMulticastGroupList = List[MulticastGroupId]
WirelessGatewayList = List[WirelessGatewayId]
WirelessDeviceList = List[WirelessDeviceId]


class TraceContent(TypedDict, total=False):
    """Trace content for your wireless devices, gateways, and multicast groups."""

    WirelessDeviceFrameInfo: Optional[WirelessDeviceFrameInfo]
    LogLevel: Optional[LogLevel]
    MulticastFrameInfo: Optional[MulticastFrameInfo]


class CreateNetworkAnalyzerConfigurationRequest(ServiceRequest):
    Name: NetworkAnalyzerConfigurationName
    TraceContent: Optional[TraceContent]
    WirelessDevices: Optional[WirelessDeviceList]
    WirelessGateways: Optional[WirelessGatewayList]
    Description: Optional[Description]
    Tags: Optional[TagList]
    ClientRequestToken: Optional[ClientRequestToken]
    MulticastGroups: Optional[NetworkAnalyzerMulticastGroupList]


class CreateNetworkAnalyzerConfigurationResponse(TypedDict, total=False):
    Arn: Optional[NetworkAnalyzerConfigurationArn]
    Name: Optional[NetworkAnalyzerConfigurationName]


class LoRaWANServiceProfile(TypedDict, total=False):
    """LoRaWANServiceProfile object."""

    AddGwMetadata: Optional[AddGwMetadata]
    DrMin: Optional[DrMinBox]
    DrMax: Optional[DrMaxBox]
    PrAllowed: Optional[PrAllowed]
    RaAllowed: Optional[RaAllowed]


class CreateServiceProfileRequest(ServiceRequest):
    Name: Optional[ServiceProfileName]
    LoRaWAN: Optional[LoRaWANServiceProfile]
    Tags: Optional[TagList]
    ClientRequestToken: Optional[ClientRequestToken]


class CreateServiceProfileResponse(TypedDict, total=False):
    Arn: Optional[ServiceProfileArn]
    Id: Optional[ServiceProfileId]


class SidewalkCreateWirelessDevice(TypedDict, total=False):
    """Sidewalk object for creating a wireless device."""

    DeviceProfileId: Optional[DeviceProfileId]


class Positioning(TypedDict, total=False):
    """The FPorts for the position information."""

    ClockSync: Optional[FPort]
    Stream: Optional[FPort]
    Gnss: Optional[FPort]


class FPorts(TypedDict, total=False):
    """List of FPort assigned for different LoRaWAN application packages to use"""

    Fuota: Optional[FPort]
    Multicast: Optional[FPort]
    ClockSync: Optional[FPort]
    Positioning: Optional[Positioning]
    Applications: Optional[Applications]


class OtaaV1_0_x(TypedDict, total=False):
    """OTAA device object for v1.0.x"""

    AppKey: Optional[AppKey]
    AppEui: Optional[AppEui]
    JoinEui: Optional[JoinEui]
    GenAppKey: Optional[GenAppKey]


class OtaaV1_1(TypedDict, total=False):
    """OTAA device object for v1.1"""

    AppKey: Optional[AppKey]
    NwkKey: Optional[NwkKey]
    JoinEui: Optional[JoinEui]


class LoRaWANDevice(TypedDict, total=False):
    """LoRaWAN object for create functions."""

    DevEui: Optional[DevEui]
    DeviceProfileId: Optional[DeviceProfileId]
    ServiceProfileId: Optional[ServiceProfileId]
    OtaaV1_1: Optional[OtaaV1_1]
    OtaaV1_0_x: Optional[OtaaV1_0_x]
    AbpV1_1: Optional[AbpV1_1]
    AbpV1_0_x: Optional[AbpV1_0_x]
    FPorts: Optional[FPorts]


class CreateWirelessDeviceRequest(ServiceRequest):
    Type: WirelessDeviceType
    Name: Optional[WirelessDeviceName]
    Description: Optional[Description]
    DestinationName: DestinationName
    ClientRequestToken: Optional[ClientRequestToken]
    LoRaWAN: Optional[LoRaWANDevice]
    Tags: Optional[TagList]
    Positioning: Optional[PositioningConfigStatus]
    Sidewalk: Optional[SidewalkCreateWirelessDevice]


class CreateWirelessDeviceResponse(TypedDict, total=False):
    Arn: Optional[WirelessDeviceArn]
    Id: Optional[WirelessDeviceId]


SubBands = List[SubBand]
NetIdFilters = List[NetId]
JoinEuiRange = List[JoinEui]
JoinEuiFilters = List[JoinEuiRange]


class LoRaWANGateway(TypedDict, total=False):
    """LoRaWANGateway object."""

    GatewayEui: Optional[GatewayEui]
    RfRegion: Optional[RfRegion]
    JoinEuiFilters: Optional[JoinEuiFilters]
    NetIdFilters: Optional[NetIdFilters]
    SubBands: Optional[SubBands]
    Beaconing: Optional[Beaconing]
    MaxEirp: Optional[GatewayMaxEirp]


class CreateWirelessGatewayRequest(ServiceRequest):
    Name: Optional[WirelessGatewayName]
    Description: Optional[Description]
    LoRaWAN: LoRaWANGateway
    Tags: Optional[TagList]
    ClientRequestToken: Optional[ClientRequestToken]


class CreateWirelessGatewayResponse(TypedDict, total=False):
    Arn: Optional[WirelessGatewayArn]
    Id: Optional[WirelessDeviceId]


class LoRaWANGatewayVersion(TypedDict, total=False):
    """LoRaWANGatewayVersion object."""

    PackageVersion: Optional[PackageVersion]
    Model: Optional[Model]
    Station: Optional[Station]


class LoRaWANUpdateGatewayTaskCreate(TypedDict, total=False):
    """LoRaWANUpdateGatewayTaskCreate object."""

    UpdateSignature: Optional[UpdateSignature]
    SigKeyCrc: Optional[Crc]
    CurrentVersion: Optional[LoRaWANGatewayVersion]
    UpdateVersion: Optional[LoRaWANGatewayVersion]


class UpdateWirelessGatewayTaskCreate(TypedDict, total=False):
    """UpdateWirelessGatewayTaskCreate object."""

    UpdateDataSource: Optional[UpdateDataSource]
    UpdateDataRole: Optional[UpdateDataSource]
    LoRaWAN: Optional[LoRaWANUpdateGatewayTaskCreate]


class CreateWirelessGatewayTaskDefinitionRequest(ServiceRequest):
    AutoCreateTasks: AutoCreateTasks
    Name: Optional[WirelessGatewayTaskName]
    Update: Optional[UpdateWirelessGatewayTaskCreate]
    ClientRequestToken: Optional[ClientRequestToken]
    Tags: Optional[TagList]


class CreateWirelessGatewayTaskDefinitionResponse(TypedDict, total=False):
    Id: Optional[WirelessGatewayTaskDefinitionId]
    Arn: Optional[WirelessGatewayTaskDefinitionArn]


class CreateWirelessGatewayTaskRequest(ServiceRequest):
    Id: WirelessGatewayId
    WirelessGatewayTaskDefinitionId: WirelessGatewayTaskDefinitionId


class CreateWirelessGatewayTaskResponse(TypedDict, total=False):
    WirelessGatewayTaskDefinitionId: Optional[WirelessGatewayTaskDefinitionId]
    Status: Optional[WirelessGatewayTaskStatus]


CreatedAt = datetime
CreationDate = datetime
CreationTime = datetime


class DakCertificateMetadata(TypedDict, total=False):
    """The device attestation key (DAK) information."""

    CertificateId: DakCertificateId
    MaxAllowedSignature: Optional[MaxAllowedSignature]
    FactorySupport: Optional[FactorySupport]
    ApId: Optional[ApId]
    DeviceTypeId: Optional[DeviceTypeId]


DakCertificateMetadataList = List[DakCertificateMetadata]


class DeleteDestinationRequest(ServiceRequest):
    Name: DestinationName


class DeleteDestinationResponse(TypedDict, total=False):
    pass


class DeleteDeviceProfileRequest(ServiceRequest):
    Id: DeviceProfileId


class DeleteDeviceProfileResponse(TypedDict, total=False):
    pass


class DeleteFuotaTaskRequest(ServiceRequest):
    Id: FuotaTaskId


class DeleteFuotaTaskResponse(TypedDict, total=False):
    pass


class DeleteMulticastGroupRequest(ServiceRequest):
    Id: MulticastGroupId


class DeleteMulticastGroupResponse(TypedDict, total=False):
    pass


class DeleteNetworkAnalyzerConfigurationRequest(ServiceRequest):
    ConfigurationName: NetworkAnalyzerConfigurationName


class DeleteNetworkAnalyzerConfigurationResponse(TypedDict, total=False):
    pass


class DeleteQueuedMessagesRequest(ServiceRequest):
    Id: WirelessDeviceId
    MessageId: MessageId
    WirelessDeviceType: Optional[WirelessDeviceType]


class DeleteQueuedMessagesResponse(TypedDict, total=False):
    pass


class DeleteServiceProfileRequest(ServiceRequest):
    Id: ServiceProfileId


class DeleteServiceProfileResponse(TypedDict, total=False):
    pass


class DeleteWirelessDeviceImportTaskRequest(ServiceRequest):
    Id: ImportTaskId


class DeleteWirelessDeviceImportTaskResponse(TypedDict, total=False):
    pass


class DeleteWirelessDeviceRequest(ServiceRequest):
    Id: WirelessDeviceId


class DeleteWirelessDeviceResponse(TypedDict, total=False):
    pass


class DeleteWirelessGatewayRequest(ServiceRequest):
    Id: WirelessGatewayId


class DeleteWirelessGatewayResponse(TypedDict, total=False):
    pass


class DeleteWirelessGatewayTaskDefinitionRequest(ServiceRequest):
    Id: WirelessGatewayTaskDefinitionId


class DeleteWirelessGatewayTaskDefinitionResponse(TypedDict, total=False):
    pass


class DeleteWirelessGatewayTaskRequest(ServiceRequest):
    Id: WirelessGatewayId


class DeleteWirelessGatewayTaskResponse(TypedDict, total=False):
    pass


class DeregisterWirelessDeviceRequest(ServiceRequest):
    Identifier: Identifier
    WirelessDeviceType: Optional[WirelessDeviceType]


class DeregisterWirelessDeviceResponse(TypedDict, total=False):
    pass


class Destinations(TypedDict, total=False):
    """Describes a destination."""

    Arn: Optional[DestinationArn]
    Name: Optional[DestinationName]
    ExpressionType: Optional[ExpressionType]
    Expression: Optional[Expression]
    Description: Optional[Description]
    RoleArn: Optional[RoleArn]


DestinationList = List[Destinations]
DeviceCertificateList = List[CertificateList]
DeviceCreationFileList = List[DeviceCreationFile]


class DeviceProfile(TypedDict, total=False):
    """Describes a device profile."""

    Arn: Optional[DeviceProfileArn]
    Name: Optional[DeviceProfileName]
    Id: Optional[DeviceProfileId]


DeviceProfileList = List[DeviceProfile]


class SidewalkEventNotificationConfigurations(TypedDict, total=False):
    """``SidewalkEventNotificationConfigurations`` object, which is the event
    configuration object for Sidewalk-related event topics.
    """

    AmazonIdEventTopic: Optional[EventNotificationTopicStatus]


class DeviceRegistrationStateEventConfiguration(TypedDict, total=False):
    """Device registration state event configuration object for enabling and
    disabling relevant topics.
    """

    Sidewalk: Optional[SidewalkEventNotificationConfigurations]
    WirelessDeviceIdEventTopic: Optional[EventNotificationTopicStatus]


class SidewalkResourceTypeEventConfiguration(TypedDict, total=False):
    """Sidewalk resource type event configuration object for enabling or
    disabling topic.
    """

    WirelessDeviceEventTopic: Optional[EventNotificationTopicStatus]


class DeviceRegistrationStateResourceTypeEventConfiguration(TypedDict, total=False):
    """Device registration state resource type event configuration object for
    enabling or disabling topic.
    """

    Sidewalk: Optional[SidewalkResourceTypeEventConfiguration]


class DisassociateAwsAccountFromPartnerAccountRequest(ServiceRequest):
    PartnerAccountId: PartnerAccountId
    PartnerType: PartnerType


class DisassociateAwsAccountFromPartnerAccountResponse(TypedDict, total=False):
    pass


class DisassociateMulticastGroupFromFuotaTaskRequest(ServiceRequest):
    Id: FuotaTaskId
    MulticastGroupId: MulticastGroupId


class DisassociateMulticastGroupFromFuotaTaskResponse(TypedDict, total=False):
    pass


class DisassociateWirelessDeviceFromFuotaTaskRequest(ServiceRequest):
    Id: FuotaTaskId
    WirelessDeviceId: WirelessDeviceId


class DisassociateWirelessDeviceFromFuotaTaskResponse(TypedDict, total=False):
    pass


class DisassociateWirelessDeviceFromMulticastGroupRequest(ServiceRequest):
    Id: MulticastGroupId
    WirelessDeviceId: WirelessDeviceId


class DisassociateWirelessDeviceFromMulticastGroupResponse(TypedDict, total=False):
    pass


class DisassociateWirelessDeviceFromThingRequest(ServiceRequest):
    Id: WirelessDeviceId


class DisassociateWirelessDeviceFromThingResponse(TypedDict, total=False):
    pass


class DisassociateWirelessGatewayFromCertificateRequest(ServiceRequest):
    Id: WirelessGatewayId


class DisassociateWirelessGatewayFromCertificateResponse(TypedDict, total=False):
    pass


class DisassociateWirelessGatewayFromThingRequest(ServiceRequest):
    Id: WirelessGatewayId


class DisassociateWirelessGatewayFromThingResponse(TypedDict, total=False):
    pass


class GatewayListItem(TypedDict, total=False):
    """Gateway list item object that specifies the frequency and list of
    gateways for which the downlink message should be sent.
    """

    GatewayId: WirelessGatewayId
    DownlinkFrequency: DownlinkFrequency


GatewayList = List[GatewayListItem]


class ParticipatingGateways(TypedDict, total=False):
    """Specify the list of gateways to which you want to send downlink data
    traffic when the wireless device is running in class B or class C mode.
    """

    DownlinkMode: DownlinkMode
    GatewayList: GatewayList
    TransmissionInterval: TransmissionInterval


class LoRaWANSendDataToDevice(TypedDict, total=False):
    """LoRaWAN router info."""

    FPort: Optional[FPort]
    ParticipatingGateways: Optional[ParticipatingGateways]


class DownlinkQueueMessage(TypedDict, total=False):
    """The message in the downlink queue."""

    MessageId: Optional[MessageId]
    TransmitMode: Optional[TransmitMode]
    ReceivedAt: Optional[ISODateTimeString]
    LoRaWAN: Optional[LoRaWANSendDataToDevice]


DownlinkQueueMessagesList = List[DownlinkQueueMessage]


class MessageDeliveryStatusEventConfiguration(TypedDict, total=False):
    """Message delivery status event configuration object for enabling and
    disabling relevant topics.
    """

    Sidewalk: Optional[SidewalkEventNotificationConfigurations]
    WirelessDeviceIdEventTopic: Optional[EventNotificationTopicStatus]


class LoRaWANJoinEventNotificationConfigurations(TypedDict, total=False):
    """Object for LoRaWAN join resource type event configuration."""

    DevEuiEventTopic: Optional[EventNotificationTopicStatus]


class JoinEventConfiguration(TypedDict, total=False):
    """Join event configuration object for enabling or disabling topic."""

    LoRaWAN: Optional[LoRaWANJoinEventNotificationConfigurations]
    WirelessDeviceIdEventTopic: Optional[EventNotificationTopicStatus]


class ProximityEventConfiguration(TypedDict, total=False):
    """Proximity event configuration object for enabling and disabling relevant
    topics.
    """

    Sidewalk: Optional[SidewalkEventNotificationConfigurations]
    WirelessDeviceIdEventTopic: Optional[EventNotificationTopicStatus]


class EventNotificationItemConfigurations(TypedDict, total=False):
    """Object of all event configurations and the status of the event topics."""

    DeviceRegistrationState: Optional[DeviceRegistrationStateEventConfiguration]
    Proximity: Optional[ProximityEventConfiguration]
    Join: Optional[JoinEventConfiguration]
    ConnectionStatus: Optional[ConnectionStatusEventConfiguration]
    MessageDeliveryStatus: Optional[MessageDeliveryStatusEventConfiguration]


class EventConfigurationItem(TypedDict, total=False):
    """Event configuration object for a single resource."""

    Identifier: Optional[Identifier]
    IdentifierType: Optional[IdentifierType]
    PartnerType: Optional[EventNotificationPartnerType]
    Events: Optional[EventNotificationItemConfigurations]


EventConfigurationsList = List[EventConfigurationItem]


class FuotaTask(TypedDict, total=False):
    """A FUOTA task."""

    Id: Optional[FuotaTaskId]
    Arn: Optional[FuotaTaskArn]
    Name: Optional[FuotaTaskName]


FuotaTaskList = List[FuotaTask]
GeoJsonPayload = bytes


class GetDestinationRequest(ServiceRequest):
    Name: DestinationName


class GetDestinationResponse(TypedDict, total=False):
    Arn: Optional[DestinationArn]
    Name: Optional[DestinationName]
    Expression: Optional[Expression]
    ExpressionType: Optional[ExpressionType]
    Description: Optional[Description]
    RoleArn: Optional[RoleArn]


class GetDeviceProfileRequest(ServiceRequest):
    Id: DeviceProfileId


class SidewalkGetDeviceProfile(TypedDict, total=False):
    """Gets information about a Sidewalk device profile."""

    ApplicationServerPublicKey: Optional[ApplicationServerPublicKey]
    QualificationStatus: Optional[QualificationStatus]
    DakCertificateMetadata: Optional[DakCertificateMetadataList]


class GetDeviceProfileResponse(TypedDict, total=False):
    Arn: Optional[DeviceProfileArn]
    Name: Optional[DeviceProfileName]
    Id: Optional[DeviceProfileId]
    LoRaWAN: Optional[LoRaWANDeviceProfile]
    Sidewalk: Optional[SidewalkGetDeviceProfile]


class GetEventConfigurationByResourceTypesRequest(ServiceRequest):
    pass


class MessageDeliveryStatusResourceTypeEventConfiguration(TypedDict, total=False):
    """Message delivery status resource type event configuration object for
    enabling or disabling relevant topic.
    """

    Sidewalk: Optional[SidewalkResourceTypeEventConfiguration]


class LoRaWANJoinResourceTypeEventConfiguration(TypedDict, total=False):
    """Object for LoRaWAN join resource type event configuration."""

    WirelessDeviceEventTopic: Optional[EventNotificationTopicStatus]


class JoinResourceTypeEventConfiguration(TypedDict, total=False):
    """Join resource type event configuration object for enabling or disabling
    topic.
    """

    LoRaWAN: Optional[LoRaWANJoinResourceTypeEventConfiguration]


class ProximityResourceTypeEventConfiguration(TypedDict, total=False):
    """Proximity resource type event configuration object for enabling or
    disabling topic.
    """

    Sidewalk: Optional[SidewalkResourceTypeEventConfiguration]


class GetEventConfigurationByResourceTypesResponse(TypedDict, total=False):
    DeviceRegistrationState: Optional[DeviceRegistrationStateResourceTypeEventConfiguration]
    Proximity: Optional[ProximityResourceTypeEventConfiguration]
    Join: Optional[JoinResourceTypeEventConfiguration]
    ConnectionStatus: Optional[ConnectionStatusResourceTypeEventConfiguration]
    MessageDeliveryStatus: Optional[MessageDeliveryStatusResourceTypeEventConfiguration]


class GetFuotaTaskRequest(ServiceRequest):
    Id: FuotaTaskId


StartTime = datetime


class LoRaWANFuotaTaskGetInfo(TypedDict, total=False):
    """The LoRaWAN information returned from getting a FUOTA task."""

    RfRegion: Optional[RfRegion]
    StartTime: Optional[StartTime]


class GetFuotaTaskResponse(TypedDict, total=False):
    Arn: Optional[FuotaTaskArn]
    Id: Optional[FuotaTaskId]
    Status: Optional[FuotaTaskStatus]
    Name: Optional[FuotaTaskName]
    Description: Optional[Description]
    LoRaWAN: Optional[LoRaWANFuotaTaskGetInfo]
    FirmwareUpdateImage: Optional[FirmwareUpdateImage]
    FirmwareUpdateRole: Optional[FirmwareUpdateRole]
    CreatedAt: Optional[CreatedAt]
    RedundancyPercent: Optional[RedundancyPercent]
    FragmentSizeBytes: Optional[FragmentSizeBytes]
    FragmentIntervalMS: Optional[FragmentIntervalMS]


class GetLogLevelsByResourceTypesRequest(ServiceRequest):
    pass


class WirelessDeviceEventLogOption(TypedDict, total=False):
    """The log options for a wireless device event and can be used to set log
    levels for a specific wireless device event.

    For a LoRaWAN device, possible events for a log messsage are: ``Join``,
    ``Rejoin``, ``Downlink_Data``, and ``Uplink_Data``. For a Sidewalk
    device, possible events for a log message are ``Registration``,
    ``Downlink_Data``, and ``Uplink_Data``.
    """

    Event: WirelessDeviceEvent
    LogLevel: LogLevel


WirelessDeviceEventLogOptionList = List[WirelessDeviceEventLogOption]


class WirelessDeviceLogOption(TypedDict, total=False):
    """The log options for wireless devices and can be used to set log levels
    for a specific type of wireless device.
    """

    Type: WirelessDeviceType
    LogLevel: LogLevel
    Events: Optional[WirelessDeviceEventLogOptionList]


WirelessDeviceLogOptionList = List[WirelessDeviceLogOption]


class WirelessGatewayEventLogOption(TypedDict, total=False):
    """The log options for a wireless gateway event and can be used to set log
    levels for a specific wireless gateway event.

    For a LoRaWAN gateway, possible events for a log message are
    ``CUPS_Request`` and ``Certificate``.
    """

    Event: WirelessGatewayEvent
    LogLevel: LogLevel


WirelessGatewayEventLogOptionList = List[WirelessGatewayEventLogOption]


class WirelessGatewayLogOption(TypedDict, total=False):
    """The log options for wireless gateways and can be used to set log levels
    for a specific type of wireless gateway.
    """

    Type: WirelessGatewayType
    LogLevel: LogLevel
    Events: Optional[WirelessGatewayEventLogOptionList]


WirelessGatewayLogOptionList = List[WirelessGatewayLogOption]


class GetLogLevelsByResourceTypesResponse(TypedDict, total=False):
    DefaultLogLevel: Optional[LogLevel]
    WirelessGatewayLogOptions: Optional[WirelessGatewayLogOptionList]
    WirelessDeviceLogOptions: Optional[WirelessDeviceLogOptionList]


class GetMulticastGroupRequest(ServiceRequest):
    Id: MulticastGroupId


class LoRaWANMulticastGet(TypedDict, total=False):
    """The LoRaWAN information that is to be returned from getting multicast
    group information.
    """

    RfRegion: Optional[SupportedRfRegion]
    DlClass: Optional[DlClass]
    NumberOfDevicesRequested: Optional[NumberOfDevicesRequested]
    NumberOfDevicesInGroup: Optional[NumberOfDevicesInGroup]


class GetMulticastGroupResponse(TypedDict, total=False):
    Arn: Optional[MulticastGroupArn]
    Id: Optional[MulticastGroupId]
    Name: Optional[MulticastGroupName]
    Description: Optional[Description]
    Status: Optional[MulticastGroupStatus]
    LoRaWAN: Optional[LoRaWANMulticastGet]
    CreatedAt: Optional[CreatedAt]


class GetMulticastGroupSessionRequest(ServiceRequest):
    Id: MulticastGroupId


SessionStartTimeTimestamp = datetime


class LoRaWANMulticastSession(TypedDict, total=False):
    """The LoRaWAN information used with the multicast session."""

    DlDr: Optional[DlDr]
    DlFreq: Optional[DlFreq]
    SessionStartTime: Optional[SessionStartTimeTimestamp]
    SessionTimeout: Optional[SessionTimeout]
    PingSlotPeriod: Optional[PingSlotPeriod]


class GetMulticastGroupSessionResponse(TypedDict, total=False):
    LoRaWAN: Optional[LoRaWANMulticastSession]


class GetNetworkAnalyzerConfigurationRequest(ServiceRequest):
    ConfigurationName: NetworkAnalyzerConfigurationName


class GetNetworkAnalyzerConfigurationResponse(TypedDict, total=False):
    TraceContent: Optional[TraceContent]
    WirelessDevices: Optional[WirelessDeviceList]
    WirelessGateways: Optional[WirelessGatewayList]
    Description: Optional[Description]
    Arn: Optional[NetworkAnalyzerConfigurationArn]
    Name: Optional[NetworkAnalyzerConfigurationName]
    MulticastGroups: Optional[NetworkAnalyzerMulticastGroupList]


class GetPartnerAccountRequest(ServiceRequest):
    PartnerAccountId: PartnerAccountId
    PartnerType: PartnerType


class SidewalkAccountInfoWithFingerprint(TypedDict, total=False):
    """Information about a Sidewalk account."""

    AmazonId: Optional[AmazonId]
    Fingerprint: Optional[Fingerprint]
    Arn: Optional[PartnerAccountArn]


class GetPartnerAccountResponse(TypedDict, total=False):
    Sidewalk: Optional[SidewalkAccountInfoWithFingerprint]
    AccountLinked: Optional[AccountLinked]


class GetPositionConfigurationRequest(ServiceRequest):
    ResourceIdentifier: PositionResourceIdentifier
    ResourceType: PositionResourceType


class SemtechGnssDetail(TypedDict, total=False):
    """Details of the Semtech GNSS solver object."""

    Provider: Optional[PositionSolverProvider]
    Type: Optional[PositionSolverType]
    Status: Optional[PositionConfigurationStatus]
    Fec: Optional[PositionConfigurationFec]


class PositionSolverDetails(TypedDict, total=False):
    """The wrapper for position solver details."""

    SemtechGnss: Optional[SemtechGnssDetail]


class GetPositionConfigurationResponse(TypedDict, total=False):
    Solvers: Optional[PositionSolverDetails]
    Destination: Optional[DestinationName]


class Gnss(TypedDict, total=False):
    """Global navigation satellite system (GNSS) object used for positioning."""

    Payload: GnssNav
    CaptureTime: Optional[GPST]
    CaptureTimeAccuracy: Optional[CaptureTimeAccuracy]
    AssistPosition: Optional[AssistPosition]
    AssistAltitude: Optional[Coordinate]
    Use2DSolver: Optional[Use2DSolver]


class Ip(TypedDict, total=False):
    """IP address used for resolving device location."""

    IpAddress: IPAddress


class WiFiAccessPoint(TypedDict, total=False):
    """Wi-Fi access point."""

    MacAddress: MacAddress
    Rss: RSS


WiFiAccessPoints = List[WiFiAccessPoint]


class GetPositionEstimateRequest(ServiceRequest):
    WiFiAccessPoints: Optional[WiFiAccessPoints]
    CellTowers: Optional[CellTowers]
    Ip: Optional[Ip]
    Gnss: Optional[Gnss]
    Timestamp: Optional[CreationDate]


class GetPositionEstimateResponse(TypedDict, total=False):
    GeoJsonPayload: Optional[Union[GeoJsonPayload, IO[GeoJsonPayload], Iterable[GeoJsonPayload]]]


class GetPositionRequest(ServiceRequest):
    ResourceIdentifier: PositionResourceIdentifier
    ResourceType: PositionResourceType


PositionCoordinate = List[PositionCoordinateValue]


class GetPositionResponse(TypedDict, total=False):
    Position: Optional[PositionCoordinate]
    Accuracy: Optional[Accuracy]
    SolverType: Optional[PositionSolverType]
    SolverProvider: Optional[PositionSolverProvider]
    SolverVersion: Optional[PositionSolverVersion]
    Timestamp: Optional[ISODateTimeString]


class GetResourceEventConfigurationRequest(ServiceRequest):
    Identifier: Identifier
    IdentifierType: IdentifierType
    PartnerType: Optional[EventNotificationPartnerType]


class GetResourceEventConfigurationResponse(TypedDict, total=False):
    DeviceRegistrationState: Optional[DeviceRegistrationStateEventConfiguration]
    Proximity: Optional[ProximityEventConfiguration]
    Join: Optional[JoinEventConfiguration]
    ConnectionStatus: Optional[ConnectionStatusEventConfiguration]
    MessageDeliveryStatus: Optional[MessageDeliveryStatusEventConfiguration]


class GetResourceLogLevelRequest(ServiceRequest):
    ResourceIdentifier: ResourceIdentifier
    ResourceType: ResourceType


class GetResourceLogLevelResponse(TypedDict, total=False):
    LogLevel: Optional[LogLevel]


class GetResourcePositionRequest(ServiceRequest):
    ResourceIdentifier: PositionResourceIdentifier
    ResourceType: PositionResourceType


class GetResourcePositionResponse(TypedDict, total=False):
    GeoJsonPayload: Optional[Union[GeoJsonPayload, IO[GeoJsonPayload], Iterable[GeoJsonPayload]]]


class GetServiceEndpointRequest(ServiceRequest):
    ServiceType: Optional[WirelessGatewayServiceType]


class GetServiceEndpointResponse(TypedDict, total=False):
    ServiceType: Optional[WirelessGatewayServiceType]
    ServiceEndpoint: Optional[EndPoint]
    ServerTrust: Optional[CertificatePEM]


class GetServiceProfileRequest(ServiceRequest):
    Id: ServiceProfileId


class LoRaWANGetServiceProfileInfo(TypedDict, total=False):
    """LoRaWANGetServiceProfileInfo object."""

    UlRate: Optional[UlRate]
    UlBucketSize: Optional[UlBucketSize]
    UlRatePolicy: Optional[UlRatePolicy]
    DlRate: Optional[DlRate]
    DlBucketSize: Optional[DlBucketSize]
    DlRatePolicy: Optional[DlRatePolicy]
    AddGwMetadata: Optional[AddGwMetadata]
    DevStatusReqFreq: Optional[DevStatusReqFreq]
    ReportDevStatusBattery: Optional[ReportDevStatusBattery]
    ReportDevStatusMargin: Optional[ReportDevStatusMargin]
    DrMin: Optional[DrMin]
    DrMax: Optional[DrMax]
    ChannelMask: Optional[ChannelMask]
    PrAllowed: Optional[PrAllowed]
    HrAllowed: Optional[HrAllowed]
    RaAllowed: Optional[RaAllowed]
    NwkGeoLoc: Optional[NwkGeoLoc]
    TargetPer: Optional[TargetPer]
    MinGwDiversity: Optional[MinGwDiversity]


class GetServiceProfileResponse(TypedDict, total=False):
    Arn: Optional[ServiceProfileArn]
    Name: Optional[ServiceProfileName]
    Id: Optional[ServiceProfileId]
    LoRaWAN: Optional[LoRaWANGetServiceProfileInfo]


class GetWirelessDeviceImportTaskRequest(ServiceRequest):
    Id: ImportTaskId


ImportedWirelessDeviceCount = int


class SidewalkGetStartImportInfo(TypedDict, total=False):
    """Sidewalk-related information for devices in an import task that are
    being onboarded.
    """

    DeviceCreationFileList: Optional[DeviceCreationFileList]
    Role: Optional[Role]


class GetWirelessDeviceImportTaskResponse(TypedDict, total=False):
    Id: Optional[ImportTaskId]
    Arn: Optional[ImportTaskArn]
    DestinationName: Optional[DestinationName]
    Sidewalk: Optional[SidewalkGetStartImportInfo]
    CreationTime: Optional[CreationTime]
    Status: Optional[ImportTaskStatus]
    StatusReason: Optional[StatusReason]
    InitializedImportedDeviceCount: Optional[ImportedWirelessDeviceCount]
    PendingImportedDeviceCount: Optional[ImportedWirelessDeviceCount]
    OnboardedImportedDeviceCount: Optional[ImportedWirelessDeviceCount]
    FailedImportedDeviceCount: Optional[ImportedWirelessDeviceCount]


class GetWirelessDeviceRequest(ServiceRequest):
    Identifier: Identifier
    IdentifierType: WirelessDeviceIdType


PrivateKeysList = List[CertificateList]


class SidewalkDevice(TypedDict, total=False):
    """Sidewalk device object."""

    AmazonId: Optional[AmazonId]
    SidewalkId: Optional[SidewalkId]
    SidewalkManufacturingSn: Optional[SidewalkManufacturingSn]
    DeviceCertificates: Optional[DeviceCertificateList]
    PrivateKeys: Optional[PrivateKeysList]
    DeviceProfileId: Optional[DeviceProfileId]
    CertificateId: Optional[DakCertificateId]
    Status: Optional[WirelessDeviceSidewalkStatus]


class GetWirelessDeviceResponse(TypedDict, total=False):
    Type: Optional[WirelessDeviceType]
    Name: Optional[WirelessDeviceName]
    Description: Optional[Description]
    DestinationName: Optional[DestinationName]
    Id: Optional[WirelessDeviceId]
    Arn: Optional[WirelessDeviceArn]
    ThingName: Optional[ThingName]
    ThingArn: Optional[ThingArn]
    LoRaWAN: Optional[LoRaWANDevice]
    Sidewalk: Optional[SidewalkDevice]
    Positioning: Optional[PositioningConfigStatus]


class GetWirelessDeviceStatisticsRequest(ServiceRequest):
    WirelessDeviceId: WirelessDeviceId


class SidewalkDeviceMetadata(TypedDict, total=False):
    """MetaData for Sidewalk device."""

    Rssi: Optional[Integer]
    BatteryLevel: Optional[BatteryLevel]
    Event: Optional[Event]
    DeviceState: Optional[DeviceState]


class LoRaWANGatewayMetadata(TypedDict, total=False):
    """LoRaWAN gateway metatdata."""

    GatewayEui: Optional[GatewayEui]
    Snr: Optional[Double]
    Rssi: Optional[Double]


LoRaWANGatewayMetadataList = List[LoRaWANGatewayMetadata]


class LoRaWANDeviceMetadata(TypedDict, total=False):
    """LoRaWAN device metatdata."""

    DevEui: Optional[DevEui]
    FPort: Optional[Integer]
    DataRate: Optional[Integer]
    Frequency: Optional[Integer]
    Timestamp: Optional[ISODateTimeString]
    Gateways: Optional[LoRaWANGatewayMetadataList]


class GetWirelessDeviceStatisticsResponse(TypedDict, total=False):
    WirelessDeviceId: Optional[WirelessDeviceId]
    LastUplinkReceivedAt: Optional[ISODateTimeString]
    LoRaWAN: Optional[LoRaWANDeviceMetadata]
    Sidewalk: Optional[SidewalkDeviceMetadata]


class GetWirelessGatewayCertificateRequest(ServiceRequest):
    Id: WirelessGatewayId


class GetWirelessGatewayCertificateResponse(TypedDict, total=False):
    IotCertificateId: Optional[IotCertificateId]
    LoRaWANNetworkServerCertificateId: Optional[IotCertificateId]


class GetWirelessGatewayFirmwareInformationRequest(ServiceRequest):
    Id: WirelessGatewayId


class LoRaWANGatewayCurrentVersion(TypedDict, total=False):
    """LoRaWANGatewayCurrentVersion object."""

    CurrentVersion: Optional[LoRaWANGatewayVersion]


class GetWirelessGatewayFirmwareInformationResponse(TypedDict, total=False):
    LoRaWAN: Optional[LoRaWANGatewayCurrentVersion]


class GetWirelessGatewayRequest(ServiceRequest):
    Identifier: Identifier
    IdentifierType: WirelessGatewayIdType


class GetWirelessGatewayResponse(TypedDict, total=False):
    Name: Optional[WirelessGatewayName]
    Id: Optional[WirelessGatewayId]
    Description: Optional[Description]
    LoRaWAN: Optional[LoRaWANGateway]
    Arn: Optional[WirelessGatewayArn]
    ThingName: Optional[ThingName]
    ThingArn: Optional[ThingArn]


class GetWirelessGatewayStatisticsRequest(ServiceRequest):
    WirelessGatewayId: WirelessGatewayId


class GetWirelessGatewayStatisticsResponse(TypedDict, total=False):
    WirelessGatewayId: Optional[WirelessGatewayId]
    LastUplinkReceivedAt: Optional[ISODateTimeString]
    ConnectionStatus: Optional[ConnectionStatus]


class GetWirelessGatewayTaskDefinitionRequest(ServiceRequest):
    Id: WirelessGatewayTaskDefinitionId


class GetWirelessGatewayTaskDefinitionResponse(TypedDict, total=False):
    AutoCreateTasks: Optional[AutoCreateTasks]
    Name: Optional[WirelessGatewayTaskName]
    Update: Optional[UpdateWirelessGatewayTaskCreate]
    Arn: Optional[WirelessGatewayTaskDefinitionArn]


class GetWirelessGatewayTaskRequest(ServiceRequest):
    Id: WirelessGatewayId


class GetWirelessGatewayTaskResponse(TypedDict, total=False):
    WirelessGatewayId: Optional[WirelessGatewayId]
    WirelessGatewayTaskDefinitionId: Optional[WirelessGatewayTaskDefinitionId]
    LastUplinkReceivedAt: Optional[ISODateTimeString]
    TaskCreatedAt: Optional[ISODateTimeString]
    Status: Optional[WirelessGatewayTaskStatus]


LastUpdateTime = datetime


class ImportedSidewalkDevice(TypedDict, total=False):
    """Information about a Sidewalk device that has been added to an import
    task.
    """

    SidewalkManufacturingSn: Optional[SidewalkManufacturingSn]
    OnboardingStatus: Optional[OnboardStatus]
    OnboardingStatusReason: Optional[OnboardStatusReason]
    LastUpdateTime: Optional[LastUpdateTime]


class ImportedWirelessDevice(TypedDict, total=False):
    """Information about a wireless device that has been added to an import
    task.
    """

    Sidewalk: Optional[ImportedSidewalkDevice]


ImportedWirelessDeviceList = List[ImportedWirelessDevice]


class ListDestinationsRequest(ServiceRequest):
    MaxResults: Optional[MaxResults]
    NextToken: Optional[NextToken]


class ListDestinationsResponse(TypedDict, total=False):
    NextToken: Optional[NextToken]
    DestinationList: Optional[DestinationList]


class ListDeviceProfilesRequest(ServiceRequest):
    NextToken: Optional[NextToken]
    MaxResults: Optional[MaxResults]
    DeviceProfileType: Optional[DeviceProfileType]


class ListDeviceProfilesResponse(TypedDict, total=False):
    NextToken: Optional[NextToken]
    DeviceProfileList: Optional[DeviceProfileList]


class ListDevicesForWirelessDeviceImportTaskRequest(ServiceRequest):
    Id: ImportTaskId
    MaxResults: Optional[MaxResults]
    NextToken: Optional[NextToken]
    Status: Optional[OnboardStatus]


class ListDevicesForWirelessDeviceImportTaskResponse(TypedDict, total=False):
    NextToken: Optional[NextToken]
    DestinationName: Optional[DestinationName]
    ImportedWirelessDeviceList: Optional[ImportedWirelessDeviceList]


class ListEventConfigurationsRequest(ServiceRequest):
    ResourceType: EventNotificationResourceType
    MaxResults: Optional[MaxResults]
    NextToken: Optional[NextToken]


class ListEventConfigurationsResponse(TypedDict, total=False):
    NextToken: Optional[NextToken]
    EventConfigurationsList: Optional[EventConfigurationsList]


class ListFuotaTasksRequest(ServiceRequest):
    NextToken: Optional[NextToken]
    MaxResults: Optional[MaxResults]


class ListFuotaTasksResponse(TypedDict, total=False):
    NextToken: Optional[NextToken]
    FuotaTaskList: Optional[FuotaTaskList]


class ListMulticastGroupsByFuotaTaskRequest(ServiceRequest):
    Id: FuotaTaskId
    NextToken: Optional[NextToken]
    MaxResults: Optional[MaxResults]


class MulticastGroupByFuotaTask(TypedDict, total=False):
    """A multicast group that is associated with a FUOTA task."""

    Id: Optional[MulticastGroupId]


MulticastGroupListByFuotaTask = List[MulticastGroupByFuotaTask]


class ListMulticastGroupsByFuotaTaskResponse(TypedDict, total=False):
    NextToken: Optional[NextToken]
    MulticastGroupList: Optional[MulticastGroupListByFuotaTask]


class ListMulticastGroupsRequest(ServiceRequest):
    NextToken: Optional[NextToken]
    MaxResults: Optional[MaxResults]


class MulticastGroup(TypedDict, total=False):
    """A multicast group."""

    Id: Optional[MulticastGroupId]
    Arn: Optional[MulticastGroupArn]
    Name: Optional[MulticastGroupName]


MulticastGroupList = List[MulticastGroup]


class ListMulticastGroupsResponse(TypedDict, total=False):
    NextToken: Optional[NextToken]
    MulticastGroupList: Optional[MulticastGroupList]


class ListNetworkAnalyzerConfigurationsRequest(ServiceRequest):
    MaxResults: Optional[MaxResults]
    NextToken: Optional[NextToken]


class NetworkAnalyzerConfigurations(TypedDict, total=False):
    """Network analyzer configurations."""

    Arn: Optional[NetworkAnalyzerConfigurationArn]
    Name: Optional[NetworkAnalyzerConfigurationName]


NetworkAnalyzerConfigurationList = List[NetworkAnalyzerConfigurations]


class ListNetworkAnalyzerConfigurationsResponse(TypedDict, total=False):
    NextToken: Optional[NextToken]
    NetworkAnalyzerConfigurationList: Optional[NetworkAnalyzerConfigurationList]


class ListPartnerAccountsRequest(ServiceRequest):
    NextToken: Optional[NextToken]
    MaxResults: Optional[MaxResults]


SidewalkAccountList = List[SidewalkAccountInfoWithFingerprint]


class ListPartnerAccountsResponse(TypedDict, total=False):
    NextToken: Optional[NextToken]
    Sidewalk: Optional[SidewalkAccountList]


class ListPositionConfigurationsRequest(ServiceRequest):
    ResourceType: Optional[PositionResourceType]
    MaxResults: Optional[MaxResults]
    NextToken: Optional[NextToken]


class PositionConfigurationItem(TypedDict, total=False):
    """The wrapper for a position configuration."""

    ResourceIdentifier: Optional[PositionResourceIdentifier]
    ResourceType: Optional[PositionResourceType]
    Solvers: Optional[PositionSolverDetails]
    Destination: Optional[DestinationName]


PositionConfigurationList = List[PositionConfigurationItem]


class ListPositionConfigurationsResponse(TypedDict, total=False):
    PositionConfigurationList: Optional[PositionConfigurationList]
    NextToken: Optional[NextToken]


class ListQueuedMessagesRequest(ServiceRequest):
    Id: WirelessDeviceId
    NextToken: Optional[NextToken]
    MaxResults: Optional[MaxResults]
    WirelessDeviceType: Optional[WirelessDeviceType]


class ListQueuedMessagesResponse(TypedDict, total=False):
    NextToken: Optional[NextToken]
    DownlinkQueueMessagesList: Optional[DownlinkQueueMessagesList]


class ListServiceProfilesRequest(ServiceRequest):
    NextToken: Optional[NextToken]
    MaxResults: Optional[MaxResults]


class ServiceProfile(TypedDict, total=False):
    """Information about a service profile."""

    Arn: Optional[ServiceProfileArn]
    Name: Optional[ServiceProfileName]
    Id: Optional[ServiceProfileId]


ServiceProfileList = List[ServiceProfile]


class ListServiceProfilesResponse(TypedDict, total=False):
    NextToken: Optional[NextToken]
    ServiceProfileList: Optional[ServiceProfileList]


class ListTagsForResourceRequest(ServiceRequest):
    ResourceArn: AmazonResourceName


class ListTagsForResourceResponse(TypedDict, total=False):
    Tags: Optional[TagList]


class ListWirelessDeviceImportTasksRequest(ServiceRequest):
    MaxResults: Optional[MaxResults]
    NextToken: Optional[NextToken]


class WirelessDeviceImportTask(TypedDict, total=False):
    """Information about an import task for wireless devices."""

    Id: Optional[ImportTaskId]
    Arn: Optional[ImportTaskArn]
    DestinationName: Optional[DestinationName]
    Sidewalk: Optional[SidewalkGetStartImportInfo]
    CreationTime: Optional[CreationTime]
    Status: Optional[ImportTaskStatus]
    StatusReason: Optional[StatusReason]
    InitializedImportedDeviceCount: Optional[ImportedWirelessDeviceCount]
    PendingImportedDeviceCount: Optional[ImportedWirelessDeviceCount]
    OnboardedImportedDeviceCount: Optional[ImportedWirelessDeviceCount]
    FailedImportedDeviceCount: Optional[ImportedWirelessDeviceCount]


WirelessDeviceImportTaskList = List[WirelessDeviceImportTask]


class ListWirelessDeviceImportTasksResponse(TypedDict, total=False):
    NextToken: Optional[NextToken]
    WirelessDeviceImportTaskList: Optional[WirelessDeviceImportTaskList]


class ListWirelessDevicesRequest(ServiceRequest):
    MaxResults: Optional[MaxResults]
    NextToken: Optional[NextToken]
    DestinationName: Optional[DestinationName]
    DeviceProfileId: Optional[DeviceProfileId]
    ServiceProfileId: Optional[ServiceProfileId]
    WirelessDeviceType: Optional[WirelessDeviceType]
    FuotaTaskId: Optional[FuotaTaskId]
    MulticastGroupId: Optional[MulticastGroupId]


class SidewalkListDevice(TypedDict, total=False):
    """Sidewalk object used by list functions."""

    AmazonId: Optional[AmazonId]
    SidewalkId: Optional[SidewalkId]
    SidewalkManufacturingSn: Optional[SidewalkManufacturingSn]
    DeviceCertificates: Optional[DeviceCertificateList]
    DeviceProfileId: Optional[DeviceProfileId]
    Status: Optional[WirelessDeviceSidewalkStatus]


class LoRaWANListDevice(TypedDict, total=False):
    """LoRaWAN object for list functions."""

    DevEui: Optional[DevEui]


class WirelessDeviceStatistics(TypedDict, total=False):
    """Information about a wireless device's operation."""

    Arn: Optional[WirelessDeviceArn]
    Id: Optional[WirelessDeviceId]
    Type: Optional[WirelessDeviceType]
    Name: Optional[WirelessDeviceName]
    DestinationName: Optional[DestinationName]
    LastUplinkReceivedAt: Optional[ISODateTimeString]
    LoRaWAN: Optional[LoRaWANListDevice]
    Sidewalk: Optional[SidewalkListDevice]
    FuotaDeviceStatus: Optional[FuotaDeviceStatus]
    MulticastDeviceStatus: Optional[MulticastDeviceStatus]
    McGroupId: Optional[McGroupId]


WirelessDeviceStatisticsList = List[WirelessDeviceStatistics]


class ListWirelessDevicesResponse(TypedDict, total=False):
    NextToken: Optional[NextToken]
    WirelessDeviceList: Optional[WirelessDeviceStatisticsList]


class ListWirelessGatewayTaskDefinitionsRequest(ServiceRequest):
    MaxResults: Optional[MaxResults]
    NextToken: Optional[NextToken]
    TaskDefinitionType: Optional[WirelessGatewayTaskDefinitionType]


class LoRaWANUpdateGatewayTaskEntry(TypedDict, total=False):
    """LoRaWANUpdateGatewayTaskEntry object."""

    CurrentVersion: Optional[LoRaWANGatewayVersion]
    UpdateVersion: Optional[LoRaWANGatewayVersion]


class UpdateWirelessGatewayTaskEntry(TypedDict, total=False):
    """UpdateWirelessGatewayTaskEntry object."""

    Id: Optional[WirelessGatewayTaskDefinitionId]
    LoRaWAN: Optional[LoRaWANUpdateGatewayTaskEntry]
    Arn: Optional[WirelessGatewayTaskDefinitionArn]


WirelessGatewayTaskDefinitionList = List[UpdateWirelessGatewayTaskEntry]


class ListWirelessGatewayTaskDefinitionsResponse(TypedDict, total=False):
    NextToken: Optional[NextToken]
    TaskDefinitions: Optional[WirelessGatewayTaskDefinitionList]


class ListWirelessGatewaysRequest(ServiceRequest):
    NextToken: Optional[NextToken]
    MaxResults: Optional[MaxResults]


class WirelessGatewayStatistics(TypedDict, total=False):
    """Information about a wireless gateway's operation."""

    Arn: Optional[WirelessGatewayArn]
    Id: Optional[WirelessGatewayId]
    Name: Optional[WirelessGatewayName]
    Description: Optional[Description]
    LoRaWAN: Optional[LoRaWANGateway]
    LastUplinkReceivedAt: Optional[ISODateTimeString]


WirelessGatewayStatisticsList = List[WirelessGatewayStatistics]


class ListWirelessGatewaysResponse(TypedDict, total=False):
    NextToken: Optional[NextToken]
    WirelessGatewayList: Optional[WirelessGatewayStatisticsList]


class LoRaWANMulticastMetadata(TypedDict, total=False):
    """The metadata information of the LoRaWAN multicast group."""

    FPort: Optional[FPort]


class LoRaWANStartFuotaTask(TypedDict, total=False):
    """The LoRaWAN information used to start a FUOTA task."""

    StartTime: Optional[StartTime]


class UpdateFPorts(TypedDict, total=False):
    """Object for updating the FPorts information."""

    Positioning: Optional[Positioning]
    Applications: Optional[Applications]


class UpdateAbpV1_0_x(TypedDict, total=False):
    """ABP device object for LoRaWAN specification v1.0.x"""

    FCntStart: Optional[FCntStart]


class UpdateAbpV1_1(TypedDict, total=False):
    """ABP device object for LoRaWAN specification v1.1"""

    FCntStart: Optional[FCntStart]


class LoRaWANUpdateDevice(TypedDict, total=False):
    """LoRaWAN object for update functions."""

    DeviceProfileId: Optional[DeviceProfileId]
    ServiceProfileId: Optional[ServiceProfileId]
    AbpV1_1: Optional[UpdateAbpV1_1]
    AbpV1_0_x: Optional[UpdateAbpV1_0_x]
    FPorts: Optional[UpdateFPorts]


class MulticastWirelessMetadata(TypedDict, total=False):
    """Wireless metadata that is to be sent to multicast group."""

    LoRaWAN: Optional[LoRaWANMulticastMetadata]


class SemtechGnssConfiguration(TypedDict, total=False):
    """Information about the Semtech GNSS solver configuration."""

    Status: PositionConfigurationStatus
    Fec: PositionConfigurationFec


class PositionSolverConfigurations(TypedDict, total=False):
    """The wrapper for position solver configurations."""

    SemtechGnss: Optional[SemtechGnssConfiguration]


class PutPositionConfigurationRequest(ServiceRequest):
    ResourceIdentifier: PositionResourceIdentifier
    ResourceType: PositionResourceType
    Solvers: Optional[PositionSolverConfigurations]
    Destination: Optional[DestinationName]


class PutPositionConfigurationResponse(TypedDict, total=False):
    pass


class PutResourceLogLevelRequest(ServiceRequest):
    ResourceIdentifier: ResourceIdentifier
    ResourceType: ResourceType
    LogLevel: LogLevel


class PutResourceLogLevelResponse(TypedDict, total=False):
    pass


class ResetAllResourceLogLevelsRequest(ServiceRequest):
    pass


class ResetAllResourceLogLevelsResponse(TypedDict, total=False):
    pass


class ResetResourceLogLevelRequest(ServiceRequest):
    ResourceIdentifier: ResourceIdentifier
    ResourceType: ResourceType


class ResetResourceLogLevelResponse(TypedDict, total=False):
    pass


class SendDataToMulticastGroupRequest(ServiceRequest):
    Id: MulticastGroupId
    PayloadData: PayloadData
    WirelessMetadata: MulticastWirelessMetadata


class SendDataToMulticastGroupResponse(TypedDict, total=False):
    MessageId: Optional[MulticastGroupMessageId]


class SidewalkSendDataToDevice(TypedDict, total=False):
    """Information about a Sidewalk router."""

    Seq: Optional[Seq]
    MessageType: Optional[MessageType]
    AckModeRetryDurationSecs: Optional[AckModeRetryDurationSecs]


class WirelessMetadata(TypedDict, total=False):
    """WirelessMetadata object."""

    LoRaWAN: Optional[LoRaWANSendDataToDevice]
    Sidewalk: Optional[SidewalkSendDataToDevice]


class SendDataToWirelessDeviceRequest(ServiceRequest):
    Id: WirelessDeviceId
    TransmitMode: TransmitMode
    PayloadData: PayloadData
    WirelessMetadata: Optional[WirelessMetadata]


class SendDataToWirelessDeviceResponse(TypedDict, total=False):
    MessageId: Optional[MessageId]


class SidewalkSingleStartImportInfo(TypedDict, total=False):
    """Information about an import task created for an individual Sidewalk
    device.
    """

    SidewalkManufacturingSn: Optional[SidewalkManufacturingSn]


class SidewalkStartImportInfo(TypedDict, total=False):
    """Information about an import task created for bulk provisioning."""

    DeviceCreationFile: Optional[DeviceCreationFile]
    Role: Optional[Role]


class SidewalkUpdateAccount(TypedDict, total=False):
    """Sidewalk update."""

    AppServerPrivateKey: Optional[AppServerPrivateKey]


class SidewalkUpdateImportInfo(TypedDict, total=False):
    """Sidewalk object information for updating an import task."""

    DeviceCreationFile: Optional[DeviceCreationFile]


class StartBulkAssociateWirelessDeviceWithMulticastGroupRequest(ServiceRequest):
    Id: MulticastGroupId
    QueryString: Optional[QueryString]
    Tags: Optional[TagList]


class StartBulkAssociateWirelessDeviceWithMulticastGroupResponse(TypedDict, total=False):
    pass


class StartBulkDisassociateWirelessDeviceFromMulticastGroupRequest(ServiceRequest):
    Id: MulticastGroupId
    QueryString: Optional[QueryString]
    Tags: Optional[TagList]


class StartBulkDisassociateWirelessDeviceFromMulticastGroupResponse(TypedDict, total=False):
    pass


class StartFuotaTaskRequest(ServiceRequest):
    Id: FuotaTaskId
    LoRaWAN: Optional[LoRaWANStartFuotaTask]


class StartFuotaTaskResponse(TypedDict, total=False):
    pass


class StartMulticastGroupSessionRequest(ServiceRequest):
    Id: MulticastGroupId
    LoRaWAN: LoRaWANMulticastSession


class StartMulticastGroupSessionResponse(TypedDict, total=False):
    pass


class StartSingleWirelessDeviceImportTaskRequest(ServiceRequest):
    DestinationName: DestinationName
    ClientRequestToken: Optional[ClientRequestToken]
    DeviceName: Optional[DeviceName]
    Tags: Optional[TagList]
    Sidewalk: SidewalkSingleStartImportInfo


class StartSingleWirelessDeviceImportTaskResponse(TypedDict, total=False):
    Id: Optional[ImportTaskId]
    Arn: Optional[ImportTaskArn]


class StartWirelessDeviceImportTaskRequest(ServiceRequest):
    DestinationName: DestinationName
    ClientRequestToken: Optional[ClientRequestToken]
    Tags: Optional[TagList]
    Sidewalk: SidewalkStartImportInfo


class StartWirelessDeviceImportTaskResponse(TypedDict, total=False):
    Id: Optional[ImportTaskId]
    Arn: Optional[ImportTaskArn]


TagKeyList = List[TagKey]


class TagResourceRequest(ServiceRequest):
    ResourceArn: AmazonResourceName
    Tags: TagList


class TagResourceResponse(TypedDict, total=False):
    pass


class TestWirelessDeviceRequest(ServiceRequest):
    Id: WirelessDeviceId


class TestWirelessDeviceResponse(TypedDict, total=False):
    Result: Optional[Result]


class UntagResourceRequest(ServiceRequest):
    ResourceArn: AmazonResourceName
    TagKeys: TagKeyList


class UntagResourceResponse(TypedDict, total=False):
    pass


class UpdateDestinationRequest(ServiceRequest):
    Name: DestinationName
    ExpressionType: Optional[ExpressionType]
    Expression: Optional[Expression]
    Description: Optional[Description]
    RoleArn: Optional[RoleArn]


class UpdateDestinationResponse(TypedDict, total=False):
    pass


class UpdateEventConfigurationByResourceTypesRequest(ServiceRequest):
    DeviceRegistrationState: Optional[DeviceRegistrationStateResourceTypeEventConfiguration]
    Proximity: Optional[ProximityResourceTypeEventConfiguration]
    Join: Optional[JoinResourceTypeEventConfiguration]
    ConnectionStatus: Optional[ConnectionStatusResourceTypeEventConfiguration]
    MessageDeliveryStatus: Optional[MessageDeliveryStatusResourceTypeEventConfiguration]


class UpdateEventConfigurationByResourceTypesResponse(TypedDict, total=False):
    pass


class UpdateFuotaTaskRequest(ServiceRequest):
    Id: FuotaTaskId
    Name: Optional[FuotaTaskName]
    Description: Optional[Description]
    LoRaWAN: Optional[LoRaWANFuotaTask]
    FirmwareUpdateImage: Optional[FirmwareUpdateImage]
    FirmwareUpdateRole: Optional[FirmwareUpdateRole]
    RedundancyPercent: Optional[RedundancyPercent]
    FragmentSizeBytes: Optional[FragmentSizeBytes]
    FragmentIntervalMS: Optional[FragmentIntervalMS]


class UpdateFuotaTaskResponse(TypedDict, total=False):
    pass


class UpdateLogLevelsByResourceTypesRequest(ServiceRequest):
    DefaultLogLevel: Optional[LogLevel]
    WirelessDeviceLogOptions: Optional[WirelessDeviceLogOptionList]
    WirelessGatewayLogOptions: Optional[WirelessGatewayLogOptionList]


class UpdateLogLevelsByResourceTypesResponse(TypedDict, total=False):
    pass


class UpdateMulticastGroupRequest(ServiceRequest):
    Id: MulticastGroupId
    Name: Optional[MulticastGroupName]
    Description: Optional[Description]
    LoRaWAN: Optional[LoRaWANMulticast]


class UpdateMulticastGroupResponse(TypedDict, total=False):
    pass


class UpdateNetworkAnalyzerConfigurationRequest(ServiceRequest):
    ConfigurationName: NetworkAnalyzerConfigurationName
    TraceContent: Optional[TraceContent]
    WirelessDevicesToAdd: Optional[WirelessDeviceList]
    WirelessDevicesToRemove: Optional[WirelessDeviceList]
    WirelessGatewaysToAdd: Optional[WirelessGatewayList]
    WirelessGatewaysToRemove: Optional[WirelessGatewayList]
    Description: Optional[Description]
    MulticastGroupsToAdd: Optional[NetworkAnalyzerMulticastGroupList]
    MulticastGroupsToRemove: Optional[NetworkAnalyzerMulticastGroupList]


class UpdateNetworkAnalyzerConfigurationResponse(TypedDict, total=False):
    pass


class UpdatePartnerAccountRequest(ServiceRequest):
    Sidewalk: SidewalkUpdateAccount
    PartnerAccountId: PartnerAccountId
    PartnerType: PartnerType


class UpdatePartnerAccountResponse(TypedDict, total=False):
    pass


class UpdatePositionRequest(ServiceRequest):
    ResourceIdentifier: PositionResourceIdentifier
    ResourceType: PositionResourceType
    Position: PositionCoordinate


class UpdatePositionResponse(TypedDict, total=False):
    pass


class UpdateResourceEventConfigurationRequest(ServiceRequest):
    Identifier: Identifier
    IdentifierType: IdentifierType
    PartnerType: Optional[EventNotificationPartnerType]
    DeviceRegistrationState: Optional[DeviceRegistrationStateEventConfiguration]
    Proximity: Optional[ProximityEventConfiguration]
    Join: Optional[JoinEventConfiguration]
    ConnectionStatus: Optional[ConnectionStatusEventConfiguration]
    MessageDeliveryStatus: Optional[MessageDeliveryStatusEventConfiguration]


class UpdateResourceEventConfigurationResponse(TypedDict, total=False):
    pass


class UpdateResourcePositionRequest(ServiceRequest):
    GeoJsonPayload: Optional[IO[GeoJsonPayload]]
    ResourceIdentifier: PositionResourceIdentifier
    ResourceType: PositionResourceType


class UpdateResourcePositionResponse(TypedDict, total=False):
    pass


class UpdateWirelessDeviceImportTaskRequest(ServiceRequest):
    Id: ImportTaskId
    Sidewalk: SidewalkUpdateImportInfo


class UpdateWirelessDeviceImportTaskResponse(TypedDict, total=False):
    pass


class UpdateWirelessDeviceRequest(ServiceRequest):
    Id: WirelessDeviceId
    DestinationName: Optional[DestinationName]
    Name: Optional[WirelessDeviceName]
    Description: Optional[Description]
    LoRaWAN: Optional[LoRaWANUpdateDevice]
    Positioning: Optional[PositioningConfigStatus]


class UpdateWirelessDeviceResponse(TypedDict, total=False):
    pass


class UpdateWirelessGatewayRequest(ServiceRequest):
    Id: WirelessGatewayId
    Name: Optional[WirelessGatewayName]
    Description: Optional[Description]
    JoinEuiFilters: Optional[JoinEuiFilters]
    NetIdFilters: Optional[NetIdFilters]
    MaxEirp: Optional[GatewayMaxEirp]


class UpdateWirelessGatewayResponse(TypedDict, total=False):
    pass


class IotwirelessApi:
    service = "iotwireless"
    version = "2020-11-22"

    @handler("AssociateAwsAccountWithPartnerAccount")
    def associate_aws_account_with_partner_account(
        self,
        context: RequestContext,
        sidewalk: SidewalkAccountInfo,
        client_request_token: ClientRequestToken = None,
        tags: TagList = None,
    ) -> AssociateAwsAccountWithPartnerAccountResponse:
        """Associates a partner account with your AWS account.

        :param sidewalk: The Sidewalk account credentials.
        :param client_request_token: Each resource must have a unique client request token.
        :param tags: The tags to attach to the specified resource.
        :returns: AssociateAwsAccountWithPartnerAccountResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        :raises ThrottlingException:
        :raises ConflictException:
        :raises AccessDeniedException:
        """
        raise NotImplementedError

    @handler("AssociateMulticastGroupWithFuotaTask")
    def associate_multicast_group_with_fuota_task(
        self, context: RequestContext, id: FuotaTaskId, multicast_group_id: MulticastGroupId
    ) -> AssociateMulticastGroupWithFuotaTaskResponse:
        """Associate a multicast group with a FUOTA task.

        :param id: The ID of a FUOTA task.
        :param multicast_group_id: The ID of the multicast group.
        :returns: AssociateMulticastGroupWithFuotaTaskResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ResourceNotFoundException:
        :raises ConflictException:
        :raises ThrottlingException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("AssociateWirelessDeviceWithFuotaTask")
    def associate_wireless_device_with_fuota_task(
        self, context: RequestContext, id: FuotaTaskId, wireless_device_id: WirelessDeviceId
    ) -> AssociateWirelessDeviceWithFuotaTaskResponse:
        """Associate a wireless device with a FUOTA task.

        :param id: The ID of a FUOTA task.
        :param wireless_device_id: The ID of the wireless device.
        :returns: AssociateWirelessDeviceWithFuotaTaskResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ResourceNotFoundException:
        :raises ConflictException:
        :raises ThrottlingException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("AssociateWirelessDeviceWithMulticastGroup")
    def associate_wireless_device_with_multicast_group(
        self, context: RequestContext, id: MulticastGroupId, wireless_device_id: WirelessDeviceId
    ) -> AssociateWirelessDeviceWithMulticastGroupResponse:
        """Associates a wireless device with a multicast group.

        :param id: The ID of the multicast group.
        :param wireless_device_id: The ID of the wireless device.
        :returns: AssociateWirelessDeviceWithMulticastGroupResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ResourceNotFoundException:
        :raises ConflictException:
        :raises ThrottlingException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("AssociateWirelessDeviceWithThing")
    def associate_wireless_device_with_thing(
        self, context: RequestContext, id: WirelessDeviceId, thing_arn: ThingArn
    ) -> AssociateWirelessDeviceWithThingResponse:
        """Associates a wireless device with a thing.

        :param id: The ID of the resource to update.
        :param thing_arn: The ARN of the thing to associate with the wireless device.
        :returns: AssociateWirelessDeviceWithThingResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ResourceNotFoundException:
        :raises ConflictException:
        :raises ThrottlingException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("AssociateWirelessGatewayWithCertificate")
    def associate_wireless_gateway_with_certificate(
        self, context: RequestContext, id: WirelessGatewayId, iot_certificate_id: IotCertificateId
    ) -> AssociateWirelessGatewayWithCertificateResponse:
        """Associates a wireless gateway with a certificate.

        :param id: The ID of the resource to update.
        :param iot_certificate_id: The ID of the certificate to associate with the wireless gateway.
        :returns: AssociateWirelessGatewayWithCertificateResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ResourceNotFoundException:
        :raises ConflictException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("AssociateWirelessGatewayWithThing")
    def associate_wireless_gateway_with_thing(
        self, context: RequestContext, id: WirelessGatewayId, thing_arn: ThingArn
    ) -> AssociateWirelessGatewayWithThingResponse:
        """Associates a wireless gateway with a thing.

        :param id: The ID of the resource to update.
        :param thing_arn: The ARN of the thing to associate with the wireless gateway.
        :returns: AssociateWirelessGatewayWithThingResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises ConflictException:
        :raises ThrottlingException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("CancelMulticastGroupSession")
    def cancel_multicast_group_session(
        self, context: RequestContext, id: MulticastGroupId
    ) -> CancelMulticastGroupSessionResponse:
        """Cancels an existing multicast group session.

        :param id: The ID of the multicast group.
        :returns: CancelMulticastGroupSessionResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises ConflictException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("CreateDestination")
    def create_destination(
        self,
        context: RequestContext,
        name: DestinationName,
        expression_type: ExpressionType,
        expression: Expression,
        role_arn: RoleArn,
        description: Description = None,
        tags: TagList = None,
        client_request_token: ClientRequestToken = None,
    ) -> CreateDestinationResponse:
        """Creates a new destination that maps a device message to an AWS IoT rule.

        :param name: The name of the new resource.
        :param expression_type: The type of value in ``Expression``.
        :param expression: The rule name or topic rule to send messages to.
        :param role_arn: The ARN of the IAM Role that authorizes the destination.
        :param description: The description of the new resource.
        :param tags: The tags to attach to the new destination.
        :param client_request_token: Each resource must have a unique client request token.
        :returns: CreateDestinationResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises ConflictException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("CreateDeviceProfile")
    def create_device_profile(
        self,
        context: RequestContext,
        name: DeviceProfileName = None,
        lo_ra_wan: LoRaWANDeviceProfile = None,
        tags: TagList = None,
        client_request_token: ClientRequestToken = None,
        sidewalk: SidewalkCreateDeviceProfile = None,
    ) -> CreateDeviceProfileResponse:
        """Creates a new device profile.

        :param name: The name of the new resource.
        :param lo_ra_wan: The device profile information to use to create the device profile.
        :param tags: The tags to attach to the new device profile.
        :param client_request_token: Each resource must have a unique client request token.
        :param sidewalk: The Sidewalk-related information for creating the Sidewalk device
        profile.
        :returns: CreateDeviceProfileResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ConflictException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("CreateFuotaTask")
    def create_fuota_task(
        self,
        context: RequestContext,
        firmware_update_image: FirmwareUpdateImage,
        firmware_update_role: FirmwareUpdateRole,
        name: FuotaTaskName = None,
        description: Description = None,
        client_request_token: ClientRequestToken = None,
        lo_ra_wan: LoRaWANFuotaTask = None,
        tags: TagList = None,
        redundancy_percent: RedundancyPercent = None,
        fragment_size_bytes: FragmentSizeBytes = None,
        fragment_interval_ms: FragmentIntervalMS = None,
    ) -> CreateFuotaTaskResponse:
        """Creates a FUOTA task.

        :param firmware_update_image: The S3 URI points to a firmware update image that is to be used with a
        FUOTA task.
        :param firmware_update_role: The firmware update role that is to be used with a FUOTA task.
        :param name: The name of a FUOTA task.
        :param description: The description of the new resource.
        :param client_request_token: Each resource must have a unique client request token.
        :param lo_ra_wan: The LoRaWAN information used with a FUOTA task.
        :param tags: The tag to attach to the specified resource.
        :param redundancy_percent: The percentage of the added fragments that are redundant.
        :param fragment_size_bytes: The size of each fragment in bytes.
        :param fragment_interval_ms: The interval for sending fragments in milliseconds, rounded to the
        nearest second.
        :returns: CreateFuotaTaskResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises ConflictException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("CreateMulticastGroup")
    def create_multicast_group(
        self,
        context: RequestContext,
        lo_ra_wan: LoRaWANMulticast,
        name: MulticastGroupName = None,
        description: Description = None,
        client_request_token: ClientRequestToken = None,
        tags: TagList = None,
    ) -> CreateMulticastGroupResponse:
        """Creates a multicast group.

        :param lo_ra_wan: The LoRaWAN information that is to be used with the multicast group.
        :param name: The name of the multicast group.
        :param description: The description of the multicast group.
        :param client_request_token: Each resource must have a unique client request token.
        :param tags: The tag to attach to the specified resource.
        :returns: CreateMulticastGroupResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises ConflictException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("CreateNetworkAnalyzerConfiguration")
    def create_network_analyzer_configuration(
        self,
        context: RequestContext,
        name: NetworkAnalyzerConfigurationName,
        trace_content: TraceContent = None,
        wireless_devices: WirelessDeviceList = None,
        wireless_gateways: WirelessGatewayList = None,
        description: Description = None,
        tags: TagList = None,
        client_request_token: ClientRequestToken = None,
        multicast_groups: NetworkAnalyzerMulticastGroupList = None,
    ) -> CreateNetworkAnalyzerConfigurationResponse:
        """Creates a new network analyzer configuration.

        :param name: Name of the network analyzer configuration.
        :param trace_content: Trace content for your wireless devices, gateways, and multicast groups.
        :param wireless_devices: Wireless device resources to add to the network analyzer configuration.
        :param wireless_gateways: Wireless gateway resources to add to the network analyzer configuration.
        :param description: The description of the new resource.
        :param tags: The tag to attach to the specified resource.
        :param client_request_token: Each resource must have a unique client request token.
        :param multicast_groups: Multicast Group resources to add to the network analyzer configruation.
        :returns: CreateNetworkAnalyzerConfigurationResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises ConflictException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("CreateServiceProfile")
    def create_service_profile(
        self,
        context: RequestContext,
        name: ServiceProfileName = None,
        lo_ra_wan: LoRaWANServiceProfile = None,
        tags: TagList = None,
        client_request_token: ClientRequestToken = None,
    ) -> CreateServiceProfileResponse:
        """Creates a new service profile.

        :param name: The name of the new resource.
        :param lo_ra_wan: The service profile information to use to create the service profile.
        :param tags: The tags to attach to the new service profile.
        :param client_request_token: Each resource must have a unique client request token.
        :returns: CreateServiceProfileResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ConflictException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("CreateWirelessDevice", expand=False)
    def create_wireless_device(
        self, context: RequestContext, request: CreateWirelessDeviceRequest
    ) -> CreateWirelessDeviceResponse:
        """Provisions a wireless device.

        :param type: The wireless device type.
        :param destination_name: The name of the destination to assign to the new wireless device.
        :param name: The name of the new resource.
        :param description: The description of the new resource.
        :param client_request_token: Each resource must have a unique client request token.
        :param lo_ra_wan: The device configuration information to use to create the wireless
        device.
        :param tags: The tags to attach to the new wireless device.
        :param positioning: FPort values for the GNSS, stream, and ClockSync functions of the
        positioning information.
        :param sidewalk: The device configuration information to use to create the Sidewalk
        device.
        :returns: CreateWirelessDeviceResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises ConflictException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("CreateWirelessGateway")
    def create_wireless_gateway(
        self,
        context: RequestContext,
        lo_ra_wan: LoRaWANGateway,
        name: WirelessGatewayName = None,
        description: Description = None,
        tags: TagList = None,
        client_request_token: ClientRequestToken = None,
    ) -> CreateWirelessGatewayResponse:
        """Provisions a wireless gateway.

        :param lo_ra_wan: The gateway configuration information to use to create the wireless
        gateway.
        :param name: The name of the new resource.
        :param description: The description of the new resource.
        :param tags: The tags to attach to the new wireless gateway.
        :param client_request_token: Each resource must have a unique client request token.
        :returns: CreateWirelessGatewayResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ConflictException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("CreateWirelessGatewayTask")
    def create_wireless_gateway_task(
        self,
        context: RequestContext,
        id: WirelessGatewayId,
        wireless_gateway_task_definition_id: WirelessGatewayTaskDefinitionId,
    ) -> CreateWirelessGatewayTaskResponse:
        """Creates a task for a wireless gateway.

        :param id: The ID of the resource to update.
        :param wireless_gateway_task_definition_id: The ID of the WirelessGatewayTaskDefinition.
        :returns: CreateWirelessGatewayTaskResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ResourceNotFoundException:
        :raises ConflictException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("CreateWirelessGatewayTaskDefinition")
    def create_wireless_gateway_task_definition(
        self,
        context: RequestContext,
        auto_create_tasks: AutoCreateTasks,
        name: WirelessGatewayTaskName = None,
        update: UpdateWirelessGatewayTaskCreate = None,
        client_request_token: ClientRequestToken = None,
        tags: TagList = None,
    ) -> CreateWirelessGatewayTaskDefinitionResponse:
        """Creates a gateway task definition.

        :param auto_create_tasks: Whether to automatically create tasks using this task definition for all
        gateways with the specified current version.
        :param name: The name of the new resource.
        :param update: Information about the gateways to update.
        :param client_request_token: Each resource must have a unique client request token.
        :param tags: The tags to attach to the specified resource.
        :returns: CreateWirelessGatewayTaskDefinitionResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ResourceNotFoundException:
        :raises ConflictException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("DeleteDestination")
    def delete_destination(
        self, context: RequestContext, name: DestinationName
    ) -> DeleteDestinationResponse:
        """Deletes a destination.

        :param name: The name of the resource to delete.
        :returns: DeleteDestinationResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises InternalServerException:
        :raises ConflictException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("DeleteDeviceProfile")
    def delete_device_profile(
        self, context: RequestContext, id: DeviceProfileId
    ) -> DeleteDeviceProfileResponse:
        """Deletes a device profile.

        :param id: The ID of the resource to delete.
        :returns: DeleteDeviceProfileResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        :raises ConflictException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("DeleteFuotaTask")
    def delete_fuota_task(
        self, context: RequestContext, id: FuotaTaskId
    ) -> DeleteFuotaTaskResponse:
        """Deletes a FUOTA task.

        :param id: The ID of a FUOTA task.
        :returns: DeleteFuotaTaskResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("DeleteMulticastGroup")
    def delete_multicast_group(
        self, context: RequestContext, id: MulticastGroupId
    ) -> DeleteMulticastGroupResponse:
        """Deletes a multicast group if it is not in use by a fuota task.

        :param id: The ID of the multicast group.
        :returns: DeleteMulticastGroupResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises ConflictException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("DeleteNetworkAnalyzerConfiguration")
    def delete_network_analyzer_configuration(
        self, context: RequestContext, configuration_name: NetworkAnalyzerConfigurationName
    ) -> DeleteNetworkAnalyzerConfigurationResponse:
        """Deletes a network analyzer configuration.

        :param configuration_name: Name of the network analyzer configuration.
        :returns: DeleteNetworkAnalyzerConfigurationResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises InternalServerException:
        :raises ConflictException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("DeleteQueuedMessages")
    def delete_queued_messages(
        self,
        context: RequestContext,
        id: WirelessDeviceId,
        message_id: MessageId,
        wireless_device_type: WirelessDeviceType = None,
    ) -> DeleteQueuedMessagesResponse:
        """Remove queued messages from the downlink queue.

        :param id: The ID of a given wireless device for which downlink messages will be
        deleted.
        :param message_id: If message ID is ``"*"``, it cleares the entire downlink queue for a
        given device, specified by the wireless device ID.
        :param wireless_device_type: The wireless device type, which can be either Sidewalk or LoRaWAN.
        :returns: DeleteQueuedMessagesResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        :raises ThrottlingException:
        :raises InternalServerException:
        :raises AccessDeniedException:
        """
        raise NotImplementedError

    @handler("DeleteServiceProfile")
    def delete_service_profile(
        self, context: RequestContext, id: ServiceProfileId
    ) -> DeleteServiceProfileResponse:
        """Deletes a service profile.

        :param id: The ID of the resource to delete.
        :returns: DeleteServiceProfileResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        :raises ConflictException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("DeleteWirelessDevice")
    def delete_wireless_device(
        self, context: RequestContext, id: WirelessDeviceId
    ) -> DeleteWirelessDeviceResponse:
        """Deletes a wireless device.

        :param id: The ID of the resource to delete.
        :returns: DeleteWirelessDeviceResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("DeleteWirelessDeviceImportTask")
    def delete_wireless_device_import_task(
        self, context: RequestContext, id: ImportTaskId
    ) -> DeleteWirelessDeviceImportTaskResponse:
        """Delete an import task.

        :param id: The unique identifier of the import task to be deleted.
        :returns: DeleteWirelessDeviceImportTaskResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        :raises ConflictException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("DeleteWirelessGateway")
    def delete_wireless_gateway(
        self, context: RequestContext, id: WirelessGatewayId
    ) -> DeleteWirelessGatewayResponse:
        """Deletes a wireless gateway.

        :param id: The ID of the resource to delete.
        :returns: DeleteWirelessGatewayResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("DeleteWirelessGatewayTask")
    def delete_wireless_gateway_task(
        self, context: RequestContext, id: WirelessGatewayId
    ) -> DeleteWirelessGatewayTaskResponse:
        """Deletes a wireless gateway task.

        :param id: The ID of the resource to delete.
        :returns: DeleteWirelessGatewayTaskResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("DeleteWirelessGatewayTaskDefinition")
    def delete_wireless_gateway_task_definition(
        self, context: RequestContext, id: WirelessGatewayTaskDefinitionId
    ) -> DeleteWirelessGatewayTaskDefinitionResponse:
        """Deletes a wireless gateway task definition. Deleting this task
        definition does not affect tasks that are currently in progress.

        :param id: The ID of the resource to delete.
        :returns: DeleteWirelessGatewayTaskDefinitionResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("DeregisterWirelessDevice")
    def deregister_wireless_device(
        self,
        context: RequestContext,
        identifier: Identifier,
        wireless_device_type: WirelessDeviceType = None,
    ) -> DeregisterWirelessDeviceResponse:
        """Deregister a wireless device from AWS IoT Wireless.

        :param identifier: The identifier of the wireless device to deregister from AWS IoT
        Wireless.
        :param wireless_device_type: The type of wireless device to deregister from AWS IoT Wireless, which
        can be ``LoRaWAN`` or ``Sidewalk``.
        :returns: DeregisterWirelessDeviceResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("DisassociateAwsAccountFromPartnerAccount")
    def disassociate_aws_account_from_partner_account(
        self,
        context: RequestContext,
        partner_account_id: PartnerAccountId,
        partner_type: PartnerType,
    ) -> DisassociateAwsAccountFromPartnerAccountResponse:
        """Disassociates your AWS account from a partner account. If
        ``PartnerAccountId`` and ``PartnerType`` are ``null``, disassociates
        your AWS account from all partner accounts.

        :param partner_account_id: The partner account ID to disassociate from the AWS account.
        :param partner_type: The partner type.
        :returns: DisassociateAwsAccountFromPartnerAccountResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("DisassociateMulticastGroupFromFuotaTask")
    def disassociate_multicast_group_from_fuota_task(
        self, context: RequestContext, id: FuotaTaskId, multicast_group_id: MulticastGroupId
    ) -> DisassociateMulticastGroupFromFuotaTaskResponse:
        """Disassociates a multicast group from a fuota task.

        :param id: The ID of a FUOTA task.
        :param multicast_group_id: The ID of the multicast group.
        :returns: DisassociateMulticastGroupFromFuotaTaskResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ResourceNotFoundException:
        :raises ConflictException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("DisassociateWirelessDeviceFromFuotaTask")
    def disassociate_wireless_device_from_fuota_task(
        self, context: RequestContext, id: FuotaTaskId, wireless_device_id: WirelessDeviceId
    ) -> DisassociateWirelessDeviceFromFuotaTaskResponse:
        """Disassociates a wireless device from a FUOTA task.

        :param id: The ID of a FUOTA task.
        :param wireless_device_id: The ID of the wireless device.
        :returns: DisassociateWirelessDeviceFromFuotaTaskResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ResourceNotFoundException:
        :raises ConflictException:
        :raises ThrottlingException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("DisassociateWirelessDeviceFromMulticastGroup")
    def disassociate_wireless_device_from_multicast_group(
        self, context: RequestContext, id: MulticastGroupId, wireless_device_id: WirelessDeviceId
    ) -> DisassociateWirelessDeviceFromMulticastGroupResponse:
        """Disassociates a wireless device from a multicast group.

        :param id: The ID of the multicast group.
        :param wireless_device_id: The ID of the wireless device.
        :returns: DisassociateWirelessDeviceFromMulticastGroupResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ResourceNotFoundException:
        :raises ThrottlingException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("DisassociateWirelessDeviceFromThing")
    def disassociate_wireless_device_from_thing(
        self, context: RequestContext, id: WirelessDeviceId
    ) -> DisassociateWirelessDeviceFromThingResponse:
        """Disassociates a wireless device from its currently associated thing.

        :param id: The ID of the resource to update.
        :returns: DisassociateWirelessDeviceFromThingResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ResourceNotFoundException:
        :raises ConflictException:
        :raises ThrottlingException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("DisassociateWirelessGatewayFromCertificate")
    def disassociate_wireless_gateway_from_certificate(
        self, context: RequestContext, id: WirelessGatewayId
    ) -> DisassociateWirelessGatewayFromCertificateResponse:
        """Disassociates a wireless gateway from its currently associated
        certificate.

        :param id: The ID of the resource to update.
        :returns: DisassociateWirelessGatewayFromCertificateResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("DisassociateWirelessGatewayFromThing")
    def disassociate_wireless_gateway_from_thing(
        self, context: RequestContext, id: WirelessGatewayId
    ) -> DisassociateWirelessGatewayFromThingResponse:
        """Disassociates a wireless gateway from its currently associated thing.

        :param id: The ID of the resource to update.
        :returns: DisassociateWirelessGatewayFromThingResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ResourceNotFoundException:
        :raises ConflictException:
        :raises ThrottlingException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("GetDestination")
    def get_destination(
        self, context: RequestContext, name: DestinationName
    ) -> GetDestinationResponse:
        """Gets information about a destination.

        :param name: The name of the resource to get.
        :returns: GetDestinationResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("GetDeviceProfile")
    def get_device_profile(
        self, context: RequestContext, id: DeviceProfileId
    ) -> GetDeviceProfileResponse:
        """Gets information about a device profile.

        :param id: The ID of the resource to get.
        :returns: GetDeviceProfileResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("GetEventConfigurationByResourceTypes")
    def get_event_configuration_by_resource_types(
        self,
        context: RequestContext,
    ) -> GetEventConfigurationByResourceTypesResponse:
        """Get the event configuration based on resource types.

        :returns: GetEventConfigurationByResourceTypesResponse
        :raises AccessDeniedException:
        :raises ThrottlingException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("GetFuotaTask")
    def get_fuota_task(self, context: RequestContext, id: FuotaTaskId) -> GetFuotaTaskResponse:
        """Gets information about a FUOTA task.

        :param id: The ID of a FUOTA task.
        :returns: GetFuotaTaskResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("GetLogLevelsByResourceTypes")
    def get_log_levels_by_resource_types(
        self,
        context: RequestContext,
    ) -> GetLogLevelsByResourceTypesResponse:
        """Returns current default log levels or log levels by resource types.
        Based on resource types, log levels can be for wireless device log
        options or wireless gateway log options.

        :returns: GetLogLevelsByResourceTypesResponse
        :raises AccessDeniedException:
        :raises InternalServerException:
        :raises ResourceNotFoundException:
        :raises ThrottlingException:
        :raises ValidationException:
        """
        raise NotImplementedError

    @handler("GetMulticastGroup")
    def get_multicast_group(
        self, context: RequestContext, id: MulticastGroupId
    ) -> GetMulticastGroupResponse:
        """Gets information about a multicast group.

        :param id: The ID of the multicast group.
        :returns: GetMulticastGroupResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("GetMulticastGroupSession")
    def get_multicast_group_session(
        self, context: RequestContext, id: MulticastGroupId
    ) -> GetMulticastGroupSessionResponse:
        """Gets information about a multicast group session.

        :param id: The ID of the multicast group.
        :returns: GetMulticastGroupSessionResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("GetNetworkAnalyzerConfiguration")
    def get_network_analyzer_configuration(
        self, context: RequestContext, configuration_name: NetworkAnalyzerConfigurationName
    ) -> GetNetworkAnalyzerConfigurationResponse:
        """Get network analyzer configuration.

        :param configuration_name: Name of the network analyzer configuration.
        :returns: GetNetworkAnalyzerConfigurationResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("GetPartnerAccount")
    def get_partner_account(
        self,
        context: RequestContext,
        partner_account_id: PartnerAccountId,
        partner_type: PartnerType,
    ) -> GetPartnerAccountResponse:
        """Gets information about a partner account. If ``PartnerAccountId`` and
        ``PartnerType`` are ``null``, returns all partner accounts.

        :param partner_account_id: The partner account ID to disassociate from the AWS account.
        :param partner_type: The partner type.
        :returns: GetPartnerAccountResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("GetPosition")
    def get_position(
        self,
        context: RequestContext,
        resource_identifier: PositionResourceIdentifier,
        resource_type: PositionResourceType,
    ) -> GetPositionResponse:
        """Get the position information for a given resource.

        This action is no longer supported. Calls to retrieve the position
        information should use the
        `GetResourcePosition <https://docs.aws.amazon.com/iot-wireless/2020-11-22/apireference/API_GetResourcePosition.html>`__
        API operation instead.

        :param resource_identifier: Resource identifier used to retrieve the position information.
        :param resource_type: Resource type of the resource for which position information is
        retrieved.
        :returns: GetPositionResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ResourceNotFoundException:
        :raises ThrottlingException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("GetPositionConfiguration")
    def get_position_configuration(
        self,
        context: RequestContext,
        resource_identifier: PositionResourceIdentifier,
        resource_type: PositionResourceType,
    ) -> GetPositionConfigurationResponse:
        """Get position configuration for a given resource.

        This action is no longer supported. Calls to retrieve the position
        configuration should use the
        `GetResourcePosition <https://docs.aws.amazon.com/iot-wireless/2020-11-22/apireference/API_GetResourcePosition.html>`__
        API operation instead.

        :param resource_identifier: Resource identifier used in a position configuration.
        :param resource_type: Resource type of the resource for which position configuration is
        retrieved.
        :returns: GetPositionConfigurationResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ResourceNotFoundException:
        :raises ThrottlingException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("GetPositionEstimate")
    def get_position_estimate(
        self,
        context: RequestContext,
        wi_fi_access_points: WiFiAccessPoints = None,
        cell_towers: CellTowers = None,
        ip: Ip = None,
        gnss: Gnss = None,
        timestamp: CreationDate = None,
    ) -> GetPositionEstimateResponse:
        """Get estimated position information as a payload in GeoJSON format. The
        payload measurement data is resolved using solvers that are provided by
        third-party vendors.

        :param wi_fi_access_points: Retrieves an estimated device position by resolving WLAN measurement
        data.
        :param cell_towers: Retrieves an estimated device position by resolving measurement data
        from cellular radio towers.
        :param ip: Retrieves an estimated device position by resolving the IP address
        information from the device.
        :param gnss: Retrieves an estimated device position by resolving the global
        navigation satellite system (GNSS) scan data.
        :param timestamp: Optional information that specifies the time when the position
        information will be resolved.
        :returns: GetPositionEstimateResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ResourceNotFoundException:
        :raises ThrottlingException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("GetResourceEventConfiguration")
    def get_resource_event_configuration(
        self,
        context: RequestContext,
        identifier: Identifier,
        identifier_type: IdentifierType,
        partner_type: EventNotificationPartnerType = None,
    ) -> GetResourceEventConfigurationResponse:
        """Get the event configuration for a particular resource identifier.

        :param identifier: Resource identifier to opt in for event messaging.
        :param identifier_type: Identifier type of the particular resource identifier for event
        configuration.
        :param partner_type: Partner type of the resource if the identifier type is
        ``PartnerAccountId``.
        :returns: GetResourceEventConfigurationResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ThrottlingException:
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("GetResourceLogLevel")
    def get_resource_log_level(
        self,
        context: RequestContext,
        resource_identifier: ResourceIdentifier,
        resource_type: ResourceType,
    ) -> GetResourceLogLevelResponse:
        """Fetches the log-level override, if any, for a given resource-ID and
        resource-type. It can be used for a wireless device or a wireless
        gateway.

        :param resource_identifier: The identifier of the resource.
        :param resource_type: The type of the resource, which can be ``WirelessDevice`` or
        ``WirelessGateway``.
        :returns: GetResourceLogLevelResponse
        :raises AccessDeniedException:
        :raises InternalServerException:
        :raises ResourceNotFoundException:
        :raises ThrottlingException:
        :raises ValidationException:
        """
        raise NotImplementedError

    @handler("GetResourcePosition")
    def get_resource_position(
        self,
        context: RequestContext,
        resource_identifier: PositionResourceIdentifier,
        resource_type: PositionResourceType,
    ) -> GetResourcePositionResponse:
        """Get the position information for a given wireless device or a wireless
        gateway resource. The position information uses the `World Geodetic
        System
        (WGS84) <https://gisgeography.com/wgs84-world-geodetic-system/>`__.

        :param resource_identifier: The identifier of the resource for which position information is
        retrieved.
        :param resource_type: The type of resource for which position information is retrieved, which
        can be a wireless device or a wireless gateway.
        :returns: GetResourcePositionResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ResourceNotFoundException:
        :raises ThrottlingException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("GetServiceEndpoint")
    def get_service_endpoint(
        self, context: RequestContext, service_type: WirelessGatewayServiceType = None
    ) -> GetServiceEndpointResponse:
        """Gets the account-specific endpoint for Configuration and Update Server
        (CUPS) protocol or LoRaWAN Network Server (LNS) connections.

        :param service_type: The service type for which to get endpoint information about.
        :returns: GetServiceEndpointResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("GetServiceProfile")
    def get_service_profile(
        self, context: RequestContext, id: ServiceProfileId
    ) -> GetServiceProfileResponse:
        """Gets information about a service profile.

        :param id: The ID of the resource to get.
        :returns: GetServiceProfileResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("GetWirelessDevice")
    def get_wireless_device(
        self, context: RequestContext, identifier: Identifier, identifier_type: WirelessDeviceIdType
    ) -> GetWirelessDeviceResponse:
        """Gets information about a wireless device.

        :param identifier: The identifier of the wireless device to get.
        :param identifier_type: The type of identifier used in ``identifier``.
        :returns: GetWirelessDeviceResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("GetWirelessDeviceImportTask")
    def get_wireless_device_import_task(
        self, context: RequestContext, id: ImportTaskId
    ) -> GetWirelessDeviceImportTaskResponse:
        """Get information about an import task and count of device onboarding
        summary information for the import task.

        :param id: The identifier of the import task for which information is requested.
        :returns: GetWirelessDeviceImportTaskResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        :raises ConflictException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("GetWirelessDeviceStatistics")
    def get_wireless_device_statistics(
        self, context: RequestContext, wireless_device_id: WirelessDeviceId
    ) -> GetWirelessDeviceStatisticsResponse:
        """Gets operating information about a wireless device.

        :param wireless_device_id: The ID of the wireless device for which to get the data.
        :returns: GetWirelessDeviceStatisticsResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("GetWirelessGateway")
    def get_wireless_gateway(
        self,
        context: RequestContext,
        identifier: Identifier,
        identifier_type: WirelessGatewayIdType,
    ) -> GetWirelessGatewayResponse:
        """Gets information about a wireless gateway.

        :param identifier: The identifier of the wireless gateway to get.
        :param identifier_type: The type of identifier used in ``identifier``.
        :returns: GetWirelessGatewayResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("GetWirelessGatewayCertificate")
    def get_wireless_gateway_certificate(
        self, context: RequestContext, id: WirelessGatewayId
    ) -> GetWirelessGatewayCertificateResponse:
        """Gets the ID of the certificate that is currently associated with a
        wireless gateway.

        :param id: The ID of the resource to get.
        :returns: GetWirelessGatewayCertificateResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("GetWirelessGatewayFirmwareInformation")
    def get_wireless_gateway_firmware_information(
        self, context: RequestContext, id: WirelessGatewayId
    ) -> GetWirelessGatewayFirmwareInformationResponse:
        """Gets the firmware version and other information about a wireless
        gateway.

        :param id: The ID of the resource to get.
        :returns: GetWirelessGatewayFirmwareInformationResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("GetWirelessGatewayStatistics")
    def get_wireless_gateway_statistics(
        self, context: RequestContext, wireless_gateway_id: WirelessGatewayId
    ) -> GetWirelessGatewayStatisticsResponse:
        """Gets operating information about a wireless gateway.

        :param wireless_gateway_id: The ID of the wireless gateway for which to get the data.
        :returns: GetWirelessGatewayStatisticsResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("GetWirelessGatewayTask")
    def get_wireless_gateway_task(
        self, context: RequestContext, id: WirelessGatewayId
    ) -> GetWirelessGatewayTaskResponse:
        """Gets information about a wireless gateway task.

        :param id: The ID of the resource to get.
        :returns: GetWirelessGatewayTaskResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("GetWirelessGatewayTaskDefinition")
    def get_wireless_gateway_task_definition(
        self, context: RequestContext, id: WirelessGatewayTaskDefinitionId
    ) -> GetWirelessGatewayTaskDefinitionResponse:
        """Gets information about a wireless gateway task definition.

        :param id: The ID of the resource to get.
        :returns: GetWirelessGatewayTaskDefinitionResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("ListDestinations")
    def list_destinations(
        self, context: RequestContext, max_results: MaxResults = None, next_token: NextToken = None
    ) -> ListDestinationsResponse:
        """Lists the destinations registered to your AWS account.

        :param max_results: The maximum number of results to return in this operation.
        :param next_token: To retrieve the next set of results, the ``nextToken`` value from a
        previous response; otherwise **null** to receive the first set of
        results.
        :returns: ListDestinationsResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("ListDeviceProfiles")
    def list_device_profiles(
        self,
        context: RequestContext,
        next_token: NextToken = None,
        max_results: MaxResults = None,
        device_profile_type: DeviceProfileType = None,
    ) -> ListDeviceProfilesResponse:
        """Lists the device profiles registered to your AWS account.

        :param next_token: To retrieve the next set of results, the ``nextToken`` value from a
        previous response; otherwise **null** to receive the first set of
        results.
        :param max_results: The maximum number of results to return in this operation.
        :param device_profile_type: A filter to list only device profiles that use this type, which can be
        ``LoRaWAN`` or ``Sidewalk``.
        :returns: ListDeviceProfilesResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("ListDevicesForWirelessDeviceImportTask")
    def list_devices_for_wireless_device_import_task(
        self,
        context: RequestContext,
        id: ImportTaskId,
        max_results: MaxResults = None,
        next_token: NextToken = None,
        status: OnboardStatus = None,
    ) -> ListDevicesForWirelessDeviceImportTaskResponse:
        """List the Sidewalk devices in an import task and their onboarding status.

        :param id: The identifier of the import task for which wireless devices are listed.
        :param max_results: The maximum number of results to return in this operation.
        :param next_token: To retrieve the next set of results, the ``nextToken`` value from a
        previous response; otherwise ``null`` to receive the first set of
        results.
        :param status: The status of the devices in the import task.
        :returns: ListDevicesForWirelessDeviceImportTaskResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        :raises ConflictException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("ListEventConfigurations")
    def list_event_configurations(
        self,
        context: RequestContext,
        resource_type: EventNotificationResourceType,
        max_results: MaxResults = None,
        next_token: NextToken = None,
    ) -> ListEventConfigurationsResponse:
        """List event configurations where at least one event topic has been
        enabled.

        :param resource_type: Resource type to filter event configurations.
        :param max_results: The maximum number of results to return in this operation.
        :param next_token: To retrieve the next set of results, the ``nextToken`` value from a
        previous response; otherwise **null** to receive the first set of
        results.
        :returns: ListEventConfigurationsResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ThrottlingException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("ListFuotaTasks")
    def list_fuota_tasks(
        self, context: RequestContext, next_token: NextToken = None, max_results: MaxResults = None
    ) -> ListFuotaTasksResponse:
        """Lists the FUOTA tasks registered to your AWS account.

        :param next_token: To retrieve the next set of results, the ``nextToken`` value from a
        previous response; otherwise **null** to receive the first set of
        results.
        :param max_results: The maximum number of results to return in this operation.
        :returns: ListFuotaTasksResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("ListMulticastGroups")
    def list_multicast_groups(
        self, context: RequestContext, next_token: NextToken = None, max_results: MaxResults = None
    ) -> ListMulticastGroupsResponse:
        """Lists the multicast groups registered to your AWS account.

        :param next_token: To retrieve the next set of results, the ``nextToken`` value from a
        previous response; otherwise **null** to receive the first set of
        results.
        :param max_results: The maximum number of results to return in this operation.
        :returns: ListMulticastGroupsResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("ListMulticastGroupsByFuotaTask")
    def list_multicast_groups_by_fuota_task(
        self,
        context: RequestContext,
        id: FuotaTaskId,
        next_token: NextToken = None,
        max_results: MaxResults = None,
    ) -> ListMulticastGroupsByFuotaTaskResponse:
        """List all multicast groups associated with a fuota task.

        :param id: The ID of a FUOTA task.
        :param next_token: To retrieve the next set of results, the ``nextToken`` value from a
        previous response; otherwise **null** to receive the first set of
        results.
        :param max_results: The maximum number of results to return in this operation.
        :returns: ListMulticastGroupsByFuotaTaskResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises InternalServerException:
        :raises ResourceNotFoundException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("ListNetworkAnalyzerConfigurations")
    def list_network_analyzer_configurations(
        self, context: RequestContext, max_results: MaxResults = None, next_token: NextToken = None
    ) -> ListNetworkAnalyzerConfigurationsResponse:
        """Lists the network analyzer configurations.

        :param max_results: The maximum number of results to return in this operation.
        :param next_token: To retrieve the next set of results, the ``nextToken`` value from a
        previous response; otherwise **null** to receive the first set of
        results.
        :returns: ListNetworkAnalyzerConfigurationsResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("ListPartnerAccounts")
    def list_partner_accounts(
        self, context: RequestContext, next_token: NextToken = None, max_results: MaxResults = None
    ) -> ListPartnerAccountsResponse:
        """Lists the partner accounts associated with your AWS account.

        :param next_token: To retrieve the next set of results, the ``nextToken`` value from a
        previous response; otherwise **null** to receive the first set of
        results.
        :param max_results: The maximum number of results to return in this operation.
        :returns: ListPartnerAccountsResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("ListPositionConfigurations")
    def list_position_configurations(
        self,
        context: RequestContext,
        resource_type: PositionResourceType = None,
        max_results: MaxResults = None,
        next_token: NextToken = None,
    ) -> ListPositionConfigurationsResponse:
        """List position configurations for a given resource, such as positioning
        solvers.

        This action is no longer supported. Calls to retrieve position
        information should use the
        `GetResourcePosition <https://docs.aws.amazon.com/iot-wireless/2020-11-22/apireference/API_GetResourcePosition.html>`__
        API operation instead.

        :param resource_type: Resource type for which position configurations are listed.
        :param max_results: The maximum number of results to return in this operation.
        :param next_token: To retrieve the next set of results, the ``nextToken`` value from a
        previous response; otherwise **null** to receive the first set of
        results.
        :returns: ListPositionConfigurationsResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ThrottlingException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("ListQueuedMessages")
    def list_queued_messages(
        self,
        context: RequestContext,
        id: WirelessDeviceId,
        next_token: NextToken = None,
        max_results: MaxResults = None,
        wireless_device_type: WirelessDeviceType = None,
    ) -> ListQueuedMessagesResponse:
        """List queued messages in the downlink queue.

        :param id: The ID of a given wireless device which the downlink message packets are
        being sent.
        :param next_token: To retrieve the next set of results, the ``nextToken`` value from a
        previous response; otherwise **null** to receive the first set of
        results.
        :param max_results: The maximum number of results to return in this operation.
        :param wireless_device_type: The wireless device type, whic can be either Sidewalk or LoRaWAN.
        :returns: ListQueuedMessagesResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        :raises ThrottlingException:
        :raises AccessDeniedException:
        """
        raise NotImplementedError

    @handler("ListServiceProfiles")
    def list_service_profiles(
        self, context: RequestContext, next_token: NextToken = None, max_results: MaxResults = None
    ) -> ListServiceProfilesResponse:
        """Lists the service profiles registered to your AWS account.

        :param next_token: To retrieve the next set of results, the ``nextToken`` value from a
        previous response; otherwise **null** to receive the first set of
        results.
        :param max_results: The maximum number of results to return in this operation.
        :returns: ListServiceProfilesResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("ListTagsForResource")
    def list_tags_for_resource(
        self, context: RequestContext, resource_arn: AmazonResourceName
    ) -> ListTagsForResourceResponse:
        """Lists the tags (metadata) you have assigned to the resource.

        :param resource_arn: The ARN of the resource for which you want to list tags.
        :returns: ListTagsForResourceResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        :raises ConflictException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("ListWirelessDeviceImportTasks")
    def list_wireless_device_import_tasks(
        self, context: RequestContext, max_results: MaxResults = None, next_token: NextToken = None
    ) -> ListWirelessDeviceImportTasksResponse:
        """List wireless devices that have been added to an import task.

        :param max_results: The maximum number of results to return in this operation.
        :param next_token: To retrieve the next set of results, the ``nextToken`` value from a
        previous response; otherwise ``null`` to receive the first set of
        results.
        :returns: ListWirelessDeviceImportTasksResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        :raises ConflictException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("ListWirelessDevices")
    def list_wireless_devices(
        self,
        context: RequestContext,
        max_results: MaxResults = None,
        next_token: NextToken = None,
        destination_name: DestinationName = None,
        device_profile_id: DeviceProfileId = None,
        service_profile_id: ServiceProfileId = None,
        wireless_device_type: WirelessDeviceType = None,
        fuota_task_id: FuotaTaskId = None,
        multicast_group_id: MulticastGroupId = None,
    ) -> ListWirelessDevicesResponse:
        """Lists the wireless devices registered to your AWS account.

        :param max_results: The maximum number of results to return in this operation.
        :param next_token: To retrieve the next set of results, the ``nextToken`` value from a
        previous response; otherwise **null** to receive the first set of
        results.
        :param destination_name: A filter to list only the wireless devices that use this destination.
        :param device_profile_id: A filter to list only the wireless devices that use this device profile.
        :param service_profile_id: A filter to list only the wireless devices that use this service
        profile.
        :param wireless_device_type: A filter to list only the wireless devices that use this wireless device
        type.
        :param fuota_task_id: The ID of a FUOTA task.
        :param multicast_group_id: The ID of the multicast group.
        :returns: ListWirelessDevicesResponse
        :raises ValidationException:
        :raises InternalServerException:
        :raises ThrottlingException:
        :raises AccessDeniedException:
        """
        raise NotImplementedError

    @handler("ListWirelessGatewayTaskDefinitions")
    def list_wireless_gateway_task_definitions(
        self,
        context: RequestContext,
        max_results: MaxResults = None,
        next_token: NextToken = None,
        task_definition_type: WirelessGatewayTaskDefinitionType = None,
    ) -> ListWirelessGatewayTaskDefinitionsResponse:
        """List the wireless gateway tasks definitions registered to your AWS
        account.

        :param max_results: The maximum number of results to return in this operation.
        :param next_token: To retrieve the next set of results, the ``nextToken`` value from a
        previous response; otherwise **null** to receive the first set of
        results.
        :param task_definition_type: A filter to list only the wireless gateway task definitions that use
        this task definition type.
        :returns: ListWirelessGatewayTaskDefinitionsResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("ListWirelessGateways")
    def list_wireless_gateways(
        self, context: RequestContext, next_token: NextToken = None, max_results: MaxResults = None
    ) -> ListWirelessGatewaysResponse:
        """Lists the wireless gateways registered to your AWS account.

        :param next_token: To retrieve the next set of results, the ``nextToken`` value from a
        previous response; otherwise **null** to receive the first set of
        results.
        :param max_results: The maximum number of results to return in this operation.
        :returns: ListWirelessGatewaysResponse
        :raises ValidationException:
        :raises InternalServerException:
        :raises ThrottlingException:
        :raises AccessDeniedException:
        """
        raise NotImplementedError

    @handler("PutPositionConfiguration")
    def put_position_configuration(
        self,
        context: RequestContext,
        resource_identifier: PositionResourceIdentifier,
        resource_type: PositionResourceType,
        solvers: PositionSolverConfigurations = None,
        destination: DestinationName = None,
    ) -> PutPositionConfigurationResponse:
        """Put position configuration for a given resource.

        This action is no longer supported. Calls to update the position
        configuration should use the
        `UpdateResourcePosition <https://docs.aws.amazon.com/iot-wireless/2020-11-22/apireference/API_UpdateResourcePosition.html>`__
        API operation instead.

        :param resource_identifier: Resource identifier used to update the position configuration.
        :param resource_type: Resource type of the resource for which you want to update the position
        configuration.
        :param solvers: The positioning solvers used to update the position configuration of the
        resource.
        :param destination: The position data destination that describes the AWS IoT rule that
        processes the device's position data for use by AWS IoT Core for
        LoRaWAN.
        :returns: PutPositionConfigurationResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ResourceNotFoundException:
        :raises ThrottlingException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("PutResourceLogLevel")
    def put_resource_log_level(
        self,
        context: RequestContext,
        resource_identifier: ResourceIdentifier,
        resource_type: ResourceType,
        log_level: LogLevel,
    ) -> PutResourceLogLevelResponse:
        """Sets the log-level override for a resource-ID and resource-type. This
        option can be specified for a wireless gateway or a wireless device. A
        limit of 200 log level override can be set per account.

        :param resource_identifier: The identifier of the resource.
        :param resource_type: The type of the resource, which can be ``WirelessDevice`` or
        ``WirelessGateway``.
        :param log_level: The log level for a log message.
        :returns: PutResourceLogLevelResponse
        :raises AccessDeniedException:
        :raises InternalServerException:
        :raises ResourceNotFoundException:
        :raises ThrottlingException:
        :raises ValidationException:
        """
        raise NotImplementedError

    @handler("ResetAllResourceLogLevels")
    def reset_all_resource_log_levels(
        self,
        context: RequestContext,
    ) -> ResetAllResourceLogLevelsResponse:
        """Removes the log-level overrides for all resources; both wireless devices
        and wireless gateways.

        :returns: ResetAllResourceLogLevelsResponse
        :raises AccessDeniedException:
        :raises InternalServerException:
        :raises ResourceNotFoundException:
        :raises ThrottlingException:
        :raises ValidationException:
        """
        raise NotImplementedError

    @handler("ResetResourceLogLevel")
    def reset_resource_log_level(
        self,
        context: RequestContext,
        resource_identifier: ResourceIdentifier,
        resource_type: ResourceType,
    ) -> ResetResourceLogLevelResponse:
        """Removes the log-level override, if any, for a specific resource-ID and
        resource-type. It can be used for a wireless device or a wireless
        gateway.

        :param resource_identifier: The identifier of the resource.
        :param resource_type: The type of the resource, which can be ``WirelessDevice`` or
        ``WirelessGateway``.
        :returns: ResetResourceLogLevelResponse
        :raises AccessDeniedException:
        :raises InternalServerException:
        :raises ResourceNotFoundException:
        :raises ThrottlingException:
        :raises ValidationException:
        """
        raise NotImplementedError

    @handler("SendDataToMulticastGroup")
    def send_data_to_multicast_group(
        self,
        context: RequestContext,
        id: MulticastGroupId,
        payload_data: PayloadData,
        wireless_metadata: MulticastWirelessMetadata,
    ) -> SendDataToMulticastGroupResponse:
        """Sends the specified data to a multicast group.

        :param id: The ID of the multicast group.
        :param payload_data: The binary to be sent to the end device, encoded in base64.
        :param wireless_metadata: Wireless metadata that is to be sent to multicast group.
        :returns: SendDataToMulticastGroupResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises ConflictException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("SendDataToWirelessDevice")
    def send_data_to_wireless_device(
        self,
        context: RequestContext,
        id: WirelessDeviceId,
        transmit_mode: TransmitMode,
        payload_data: PayloadData,
        wireless_metadata: WirelessMetadata = None,
    ) -> SendDataToWirelessDeviceResponse:
        """Sends a decrypted application data frame to a device.

        :param id: The ID of the wireless device to receive the data.
        :param transmit_mode: The transmit mode to use to send data to the wireless device.
        :param payload_data: The binary to be sent to the end device, encoded in base64.
        :param wireless_metadata: Metadata about the message request.
        :returns: SendDataToWirelessDeviceResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        :raises ThrottlingException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("StartBulkAssociateWirelessDeviceWithMulticastGroup")
    def start_bulk_associate_wireless_device_with_multicast_group(
        self,
        context: RequestContext,
        id: MulticastGroupId,
        query_string: QueryString = None,
        tags: TagList = None,
    ) -> StartBulkAssociateWirelessDeviceWithMulticastGroupResponse:
        """Starts a bulk association of all qualifying wireless devices with a
        multicast group.

        :param id: The ID of the multicast group.
        :param query_string: Query string used to search for wireless devices as part of the bulk
        associate and disassociate process.
        :param tags: The tag to attach to the specified resource.
        :returns: StartBulkAssociateWirelessDeviceWithMulticastGroupResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("StartBulkDisassociateWirelessDeviceFromMulticastGroup")
    def start_bulk_disassociate_wireless_device_from_multicast_group(
        self,
        context: RequestContext,
        id: MulticastGroupId,
        query_string: QueryString = None,
        tags: TagList = None,
    ) -> StartBulkDisassociateWirelessDeviceFromMulticastGroupResponse:
        """Starts a bulk disassociatin of all qualifying wireless devices from a
        multicast group.

        :param id: The ID of the multicast group.
        :param query_string: Query string used to search for wireless devices as part of the bulk
        associate and disassociate process.
        :param tags: The tag to attach to the specified resource.
        :returns: StartBulkDisassociateWirelessDeviceFromMulticastGroupResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("StartFuotaTask")
    def start_fuota_task(
        self, context: RequestContext, id: FuotaTaskId, lo_ra_wan: LoRaWANStartFuotaTask = None
    ) -> StartFuotaTaskResponse:
        """Starts a FUOTA task.

        :param id: The ID of a FUOTA task.
        :param lo_ra_wan: The LoRaWAN information used to start a FUOTA task.
        :returns: StartFuotaTaskResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ResourceNotFoundException:
        :raises ConflictException:
        :raises ThrottlingException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("StartMulticastGroupSession")
    def start_multicast_group_session(
        self, context: RequestContext, id: MulticastGroupId, lo_ra_wan: LoRaWANMulticastSession
    ) -> StartMulticastGroupSessionResponse:
        """Starts a multicast group session.

        :param id: The ID of the multicast group.
        :param lo_ra_wan: The LoRaWAN information used with the multicast session.
        :returns: StartMulticastGroupSessionResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises ConflictException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("StartSingleWirelessDeviceImportTask")
    def start_single_wireless_device_import_task(
        self,
        context: RequestContext,
        destination_name: DestinationName,
        sidewalk: SidewalkSingleStartImportInfo,
        client_request_token: ClientRequestToken = None,
        device_name: DeviceName = None,
        tags: TagList = None,
    ) -> StartSingleWirelessDeviceImportTaskResponse:
        """Start import task for a single wireless device.

        :param destination_name: The name of the Sidewalk destination that describes the IoT rule to
        route messages from the device in the import task that will be onboarded
        to AWS IoT Wireless.
        :param sidewalk: The Sidewalk-related parameters for importing a single wireless device.
        :param client_request_token: Each resource must have a unique client request token.
        :param device_name: The name of the wireless device for which an import task is being
        started.
        :param tags: The tag to attach to the specified resource.
        :returns: StartSingleWirelessDeviceImportTaskResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        :raises ConflictException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("StartWirelessDeviceImportTask")
    def start_wireless_device_import_task(
        self,
        context: RequestContext,
        destination_name: DestinationName,
        sidewalk: SidewalkStartImportInfo,
        client_request_token: ClientRequestToken = None,
        tags: TagList = None,
    ) -> StartWirelessDeviceImportTaskResponse:
        """Start import task for provisioning Sidewalk devices in bulk using an S3
        CSV file.

        :param destination_name: The name of the Sidewalk destination that describes the IoT rule to
        route messages from the devices in the import task that are onboarded to
        AWS IoT Wireless.
        :param sidewalk: The Sidewalk-related parameters for importing wireless devices that need
        to be provisioned in bulk.
        :param client_request_token: Each resource must have a unique client request token.
        :param tags: The tag to attach to the specified resource.
        :returns: StartWirelessDeviceImportTaskResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        :raises ConflictException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("TagResource")
    def tag_resource(
        self, context: RequestContext, resource_arn: AmazonResourceName, tags: TagList
    ) -> TagResourceResponse:
        """Adds a tag to a resource.

        :param resource_arn: The ARN of the resource to add tags to.
        :param tags: Adds to or modifies the tags of the given resource.
        :returns: TagResourceResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        :raises ConflictException:
        :raises InternalServerException:
        :raises ThrottlingException:
        :raises TooManyTagsException:
        """
        raise NotImplementedError

    @handler("TestWirelessDevice")
    def test_wireless_device(
        self, context: RequestContext, id: WirelessDeviceId
    ) -> TestWirelessDeviceResponse:
        """Simulates a provisioned device by sending an uplink data payload of
        ``Hello``.

        :param id: The ID of the wireless device to test.
        :returns: TestWirelessDeviceResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        :raises ThrottlingException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("UntagResource")
    def untag_resource(
        self, context: RequestContext, resource_arn: AmazonResourceName, tag_keys: TagKeyList
    ) -> UntagResourceResponse:
        """Removes one or more tags from a resource.

        :param resource_arn: The ARN of the resource to remove tags from.
        :param tag_keys: A list of the keys of the tags to remove from the resource.
        :returns: UntagResourceResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        :raises ConflictException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("UpdateDestination")
    def update_destination(
        self,
        context: RequestContext,
        name: DestinationName,
        expression_type: ExpressionType = None,
        expression: Expression = None,
        description: Description = None,
        role_arn: RoleArn = None,
    ) -> UpdateDestinationResponse:
        """Updates properties of a destination.

        :param name: The new name of the resource.
        :param expression_type: The type of value in ``Expression``.
        :param expression: The new rule name or topic rule to send messages to.
        :param description: A new description of the resource.
        :param role_arn: The ARN of the IAM Role that authorizes the destination.
        :returns: UpdateDestinationResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("UpdateEventConfigurationByResourceTypes")
    def update_event_configuration_by_resource_types(
        self,
        context: RequestContext,
        device_registration_state: DeviceRegistrationStateResourceTypeEventConfiguration = None,
        proximity: ProximityResourceTypeEventConfiguration = None,
        join: JoinResourceTypeEventConfiguration = None,
        connection_status: ConnectionStatusResourceTypeEventConfiguration = None,
        message_delivery_status: MessageDeliveryStatusResourceTypeEventConfiguration = None,
    ) -> UpdateEventConfigurationByResourceTypesResponse:
        """Update the event configuration based on resource types.

        :param device_registration_state: Device registration state resource type event configuration object for
        enabling and disabling wireless gateway topic.
        :param proximity: Proximity resource type event configuration object for enabling and
        disabling wireless gateway topic.
        :param join: Join resource type event configuration object for enabling and disabling
        wireless device topic.
        :param connection_status: Connection status resource type event configuration object for enabling
        and disabling wireless gateway topic.
        :param message_delivery_status: Message delivery status resource type event configuration object for
        enabling and disabling wireless device topic.
        :returns: UpdateEventConfigurationByResourceTypesResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ThrottlingException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("UpdateFuotaTask")
    def update_fuota_task(
        self,
        context: RequestContext,
        id: FuotaTaskId,
        name: FuotaTaskName = None,
        description: Description = None,
        lo_ra_wan: LoRaWANFuotaTask = None,
        firmware_update_image: FirmwareUpdateImage = None,
        firmware_update_role: FirmwareUpdateRole = None,
        redundancy_percent: RedundancyPercent = None,
        fragment_size_bytes: FragmentSizeBytes = None,
        fragment_interval_ms: FragmentIntervalMS = None,
    ) -> UpdateFuotaTaskResponse:
        """Updates properties of a FUOTA task.

        :param id: The ID of a FUOTA task.
        :param name: The name of a FUOTA task.
        :param description: The description of the new resource.
        :param lo_ra_wan: The LoRaWAN information used with a FUOTA task.
        :param firmware_update_image: The S3 URI points to a firmware update image that is to be used with a
        FUOTA task.
        :param firmware_update_role: The firmware update role that is to be used with a FUOTA task.
        :param redundancy_percent: The percentage of the added fragments that are redundant.
        :param fragment_size_bytes: The size of each fragment in bytes.
        :param fragment_interval_ms: The interval for sending fragments in milliseconds, rounded to the
        nearest second.
        :returns: UpdateFuotaTaskResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises ConflictException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("UpdateLogLevelsByResourceTypes")
    def update_log_levels_by_resource_types(
        self,
        context: RequestContext,
        default_log_level: LogLevel = None,
        wireless_device_log_options: WirelessDeviceLogOptionList = None,
        wireless_gateway_log_options: WirelessGatewayLogOptionList = None,
    ) -> UpdateLogLevelsByResourceTypesResponse:
        """Set default log level, or log levels by resource types. This can be for
        wireless device log options or wireless gateways log options and is used
        to control the log messages that'll be displayed in CloudWatch.

        :param default_log_level: The log level for a log message.
        :param wireless_device_log_options: The list of wireless device log options.
        :param wireless_gateway_log_options: The list of wireless gateway log options.
        :returns: UpdateLogLevelsByResourceTypesResponse
        :raises AccessDeniedException:
        :raises ConflictException:
        :raises InternalServerException:
        :raises ResourceNotFoundException:
        :raises ThrottlingException:
        :raises ValidationException:
        """
        raise NotImplementedError

    @handler("UpdateMulticastGroup")
    def update_multicast_group(
        self,
        context: RequestContext,
        id: MulticastGroupId,
        name: MulticastGroupName = None,
        description: Description = None,
        lo_ra_wan: LoRaWANMulticast = None,
    ) -> UpdateMulticastGroupResponse:
        """Updates properties of a multicast group session.

        :param id: The ID of the multicast group.
        :param name: The name of the multicast group.
        :param description: The description of the new resource.
        :param lo_ra_wan: The LoRaWAN information that is to be used with the multicast group.
        :returns: UpdateMulticastGroupResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises ConflictException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("UpdateNetworkAnalyzerConfiguration")
    def update_network_analyzer_configuration(
        self,
        context: RequestContext,
        configuration_name: NetworkAnalyzerConfigurationName,
        trace_content: TraceContent = None,
        wireless_devices_to_add: WirelessDeviceList = None,
        wireless_devices_to_remove: WirelessDeviceList = None,
        wireless_gateways_to_add: WirelessGatewayList = None,
        wireless_gateways_to_remove: WirelessGatewayList = None,
        description: Description = None,
        multicast_groups_to_add: NetworkAnalyzerMulticastGroupList = None,
        multicast_groups_to_remove: NetworkAnalyzerMulticastGroupList = None,
    ) -> UpdateNetworkAnalyzerConfigurationResponse:
        """Update network analyzer configuration.

        :param configuration_name: Name of the network analyzer configuration.
        :param trace_content: Trace content for your wireless devices, gateways, and multicast groups.
        :param wireless_devices_to_add: Wireless device resources to add to the network analyzer configuration.
        :param wireless_devices_to_remove: Wireless device resources to remove from the network analyzer
        configuration.
        :param wireless_gateways_to_add: Wireless gateway resources to add to the network analyzer configuration.
        :param wireless_gateways_to_remove: Wireless gateway resources to remove from the network analyzer
        configuration.
        :param description: The description of the new resource.
        :param multicast_groups_to_add: Multicast group resources to add to the network analyzer configuration.
        :param multicast_groups_to_remove: Multicast group resources to remove from the network analyzer
        configuration.
        :returns: UpdateNetworkAnalyzerConfigurationResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("UpdatePartnerAccount")
    def update_partner_account(
        self,
        context: RequestContext,
        sidewalk: SidewalkUpdateAccount,
        partner_account_id: PartnerAccountId,
        partner_type: PartnerType,
    ) -> UpdatePartnerAccountResponse:
        """Updates properties of a partner account.

        :param sidewalk: The Sidewalk account credentials.
        :param partner_account_id: The ID of the partner account to update.
        :param partner_type: The partner type.
        :returns: UpdatePartnerAccountResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("UpdatePosition")
    def update_position(
        self,
        context: RequestContext,
        resource_identifier: PositionResourceIdentifier,
        resource_type: PositionResourceType,
        position: PositionCoordinate,
    ) -> UpdatePositionResponse:
        """Update the position information of a resource.

        This action is no longer supported. Calls to update the position
        information should use the
        `UpdateResourcePosition <https://docs.aws.amazon.com/iot-wireless/2020-11-22/apireference/API_UpdateResourcePosition.html>`__
        API operation instead.

        :param resource_identifier: Resource identifier of the resource for which position is updated.
        :param resource_type: Resource type of the resource for which position is updated.
        :param position: The position information of the resource.
        :returns: UpdatePositionResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ResourceNotFoundException:
        :raises ThrottlingException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("UpdateResourceEventConfiguration")
    def update_resource_event_configuration(
        self,
        context: RequestContext,
        identifier: Identifier,
        identifier_type: IdentifierType,
        partner_type: EventNotificationPartnerType = None,
        device_registration_state: DeviceRegistrationStateEventConfiguration = None,
        proximity: ProximityEventConfiguration = None,
        join: JoinEventConfiguration = None,
        connection_status: ConnectionStatusEventConfiguration = None,
        message_delivery_status: MessageDeliveryStatusEventConfiguration = None,
    ) -> UpdateResourceEventConfigurationResponse:
        """Update the event configuration for a particular resource identifier.

        :param identifier: Resource identifier to opt in for event messaging.
        :param identifier_type: Identifier type of the particular resource identifier for event
        configuration.
        :param partner_type: Partner type of the resource if the identifier type is
        ``PartnerAccountId``.
        :param device_registration_state: Event configuration for the device registration state event.
        :param proximity: Event configuration for the proximity event.
        :param join: Event configuration for the join event.
        :param connection_status: Event configuration for the connection status event.
        :param message_delivery_status: Event configuration for the message delivery status event.
        :returns: UpdateResourceEventConfigurationResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ConflictException:
        :raises ThrottlingException:
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("UpdateResourcePosition")
    def update_resource_position(
        self,
        context: RequestContext,
        resource_identifier: PositionResourceIdentifier,
        resource_type: PositionResourceType,
        geo_json_payload: IO[GeoJsonPayload] = None,
    ) -> UpdateResourcePositionResponse:
        """Update the position information of a given wireless device or a wireless
        gateway resource. The position coordinates are based on the `World
        Geodetic System
        (WGS84) <https://gisgeography.com/wgs84-world-geodetic-system/>`__.

        :param resource_identifier: The identifier of the resource for which position information is
        updated.
        :param resource_type: The type of resource for which position information is updated, which
        can be a wireless device or a wireless gateway.
        :param geo_json_payload: The position information of the resource, displayed as a JSON payload.
        :returns: UpdateResourcePositionResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ResourceNotFoundException:
        :raises ThrottlingException:
        :raises InternalServerException:
        """
        raise NotImplementedError

    @handler("UpdateWirelessDevice")
    def update_wireless_device(
        self,
        context: RequestContext,
        id: WirelessDeviceId,
        destination_name: DestinationName = None,
        name: WirelessDeviceName = None,
        description: Description = None,
        lo_ra_wan: LoRaWANUpdateDevice = None,
        positioning: PositioningConfigStatus = None,
    ) -> UpdateWirelessDeviceResponse:
        """Updates properties of a wireless device.

        :param id: The ID of the resource to update.
        :param destination_name: The name of the new destination for the device.
        :param name: The new name of the resource.
        :param description: A new description of the resource.
        :param lo_ra_wan: The updated wireless device's configuration.
        :param positioning: FPort values for the GNSS, stream, and ClockSync functions of the
        positioning information.
        :returns: UpdateWirelessDeviceResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("UpdateWirelessDeviceImportTask")
    def update_wireless_device_import_task(
        self, context: RequestContext, id: ImportTaskId, sidewalk: SidewalkUpdateImportInfo
    ) -> UpdateWirelessDeviceImportTaskResponse:
        """Update an import task to add more devices to the task.

        :param id: The identifier of the import task to be updated.
        :param sidewalk: The Sidewalk-related parameters of the import task to be updated.
        :returns: UpdateWirelessDeviceImportTaskResponse
        :raises ValidationException:
        :raises AccessDeniedException:
        :raises ResourceNotFoundException:
        :raises InternalServerException:
        :raises ConflictException:
        :raises ThrottlingException:
        """
        raise NotImplementedError

    @handler("UpdateWirelessGateway")
    def update_wireless_gateway(
        self,
        context: RequestContext,
        id: WirelessGatewayId,
        name: WirelessGatewayName = None,
        description: Description = None,
        join_eui_filters: JoinEuiFilters = None,
        net_id_filters: NetIdFilters = None,
        max_eirp: GatewayMaxEirp = None,
    ) -> UpdateWirelessGatewayResponse:
        """Updates properties of a wireless gateway.

        :param id: The ID of the resource to update.
        :param name: The new name of the resource.
        :param description: A new description of the resource.
        :param join_eui_filters: A list of JoinEuiRange used by LoRa gateways to filter LoRa frames.
        :param net_id_filters: A list of NetId values that are used by LoRa gateways to filter the
        uplink frames.
        :param max_eirp: The MaxEIRP value.
        :returns: UpdateWirelessGatewayResponse
        :raises ValidationException:
        :raises ResourceNotFoundException:
        :raises AccessDeniedException:
        :raises InternalServerException:
        :raises ThrottlingException:
        """
        raise NotImplementedError
