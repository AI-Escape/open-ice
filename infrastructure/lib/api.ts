import { Construct } from "constructs";
import {
  Vpc,
  Instance,
  InstanceType,
  InstanceClass,
  InstanceSize,
  MachineImage,
  SecurityGroup,
  Peer,
  Port,
  BlockDeviceVolume,
  IVpc,
  KeyPair,
  KeyPairType,
  OperatingSystemType,
  IKeyPair,
  CfnEIP,
  CfnEIPAssociation,
} from "aws-cdk-lib/aws-ec2";
import {
  Distribution,
  OriginAccessIdentity,
  ViewerProtocolPolicy,
  AllowedMethods,
  CachePolicy,
  OriginRequestPolicy,
  ResponseHeadersPolicy,
  HttpVersion,
  PriceClass,
  OriginProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { HttpOrigin } from "aws-cdk-lib/aws-cloudfront-origins";
import {
  ARecord,
  CnameRecord,
  HostedZone,
  IHostedZone,
  RecordTarget,
} from "aws-cdk-lib/aws-route53";
import { CloudFrontTarget } from "aws-cdk-lib/aws-route53-targets";
import { ICertificate } from "aws-cdk-lib/aws-certificatemanager";
import { Duration } from "aws-cdk-lib";

interface ApiConstructProps {
  domainName: string;
  name: string;
  instanceName: string;
  cert: ICertificate;
  hostedZone: IHostedZone;
  instanceType: InstanceType;
  storageSizeGiB: number;
  vpc: IVpc;
  keyPair: IKeyPair;
}

export class ApiConstruct extends Construct {
  public readonly ec2Instance: Instance;
  public readonly elasticIp: CfnEIP;

  constructor(scope: Construct, id: string, props: ApiConstructProps) {
    super(scope, id);

    const {
      domainName,
      hostedZone,
      cert,
      name,
      instanceName,
      instanceType,
      storageSizeGiB,
      vpc,
      keyPair,
    } = props;

    const securityGroup = new SecurityGroup(this, "ApiSecurityGroup", {
      vpc,
      description: "Allow SSH and HTTP",
      allowAllOutbound: true,
    });
    // Allow HTTP from CloudFront
    securityGroup.addIngressRule(
      Peer.prefixList("pl-82a045eb"),
      Port.tcp(80),
      "Allow HTTP from CloudFront"
    );
    // Allow SSH from anywhere
    securityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(22),
      "Allow SSH access from anywhere"
    );

    // Get the latest Amazon Linux 2 ARM AMI
    const ami = MachineImage.fromSsmParameter(
      "/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-arm64-gp2",
      {
        os: OperatingSystemType.LINUX,
      }
    );

    this.ec2Instance = new Instance(this, "ApiInstance", {
      instanceType: instanceType,
      machineImage: ami,
      instanceName: `${instanceName}-instance`,
      vpc: vpc,
      securityGroup: securityGroup,
      blockDevices: [
        {
          // this name is specific to the AMI used
          // deviceName: '/dev/sda1', // for ubuntu x86_64
          deviceName: "/dev/xvda", // for Amazon Linux 2 ARM
          volume: BlockDeviceVolume.ebs(storageSizeGiB),
        },
      ],
      keyPair: keyPair,
      availabilityZone: "us-west-2a",
    });

    // Allocate an Elastic IP
    this.elasticIp = new CfnEIP(this, "ApiElasticIp");

    // Associate the Elastic IP with the EC2 instance
    new CfnEIPAssociation(this, "ApiEIPAssociation", {
      allocationId: this.elasticIp.attrAllocationId,
      //   eip: this.elasticIp.ref,
      instanceId: this.ec2Instance.instanceId,
    });

    const apiInstanceName = `${instanceName}-instance`;
    // Route53 record for the CloudFront distribution for ec2 SSH access
    const apiRecord = new ARecord(this, "InstanceAliasRecord", {
      zone: hostedZone,
      recordName: apiInstanceName,
      ttl: Duration.minutes(5),
      target: RecordTarget.fromIpAddresses(this.elasticIp.ref),
    });

    // CloudFront distribution for the API
    const distribution = new Distribution(this, "ApiDistribution", {
      priceClass: PriceClass.PRICE_CLASS_100,
      httpVersion: HttpVersion.HTTP2_AND_3,
      certificate: cert,
      defaultBehavior: {
        origin: new HttpOrigin(apiRecord.domainName, {
          originId: domainName,
          protocolPolicy: OriginProtocolPolicy.HTTP_ONLY,
        }),
        allowedMethods: AllowedMethods.ALLOW_ALL,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: CachePolicy.CACHING_DISABLED,
        originRequestPolicy: OriginRequestPolicy.ALL_VIEWER,
        responseHeadersPolicy:
          ResponseHeadersPolicy.CORS_ALLOW_ALL_ORIGINS_WITH_PREFLIGHT,
        compress: true,
      },
      domainNames: [domainName],
    });

    // Route53 record for the CloudFront distribution for API requests
    new ARecord(this, "ApiAliasRecord", {
      zone: hostedZone,
      recordName: name,
      target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
    });
  }
}
