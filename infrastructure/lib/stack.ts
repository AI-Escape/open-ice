import * as cdk from "aws-cdk-lib";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";
import {
  InstanceClass,
  InstanceSize,
  InstanceType,
  KeyPair,
  Vpc,
} from "aws-cdk-lib/aws-ec2";
import { HostedZone } from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";
import { SPAWebsiteConstruct } from "./website";
import { ApiConstruct } from "./api";

export class OpenIceCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // root AI Escape domain
    const rootDomain = "openice.org";
    const hostedZoneId = "Z03040731659X9XHZO68D";
    // existing certificate for any *.openice.org domain
    const certificateArn =
      "arn:aws:acm:us-east-1:073283262657:certificate/d036afb4-d97b-4b45-8cc7-b7a73f191408";
    const vpcId = "vpc-0264833eefd9aa9c0";

    // name of the app
    const name = "OpenIce";

    // key pair for ssh access, must create in advanced as RSA .pem file
    const keyPair = KeyPair.fromKeyPairName(
      this,
      "ApiInstanceKeyPair",
      "open-ice-instance"
    );

    // instance sizes
    const apiInstanceType = InstanceType.of(
      InstanceClass.T4G,
      InstanceSize.MEDIUM
    );
    const apiInstanceStorageSizeGiB = 64;

    const webDomain = `www.${rootDomain}`;
    const apiDomain = `api.${rootDomain}`;

    // Import the existing hosted zone
    const hostedZone = HostedZone.fromHostedZoneAttributes(
      this,
      "RootHostedZone",
      {
        zoneName: rootDomain,
        hostedZoneId: hostedZoneId,
      }
    );
    const cert = Certificate.fromCertificateArn(
      this,
      "RootCertificate",
      certificateArn
    );

    // default VPC
    const vpc = Vpc.fromLookup(this, "VPC", {
      vpcId: vpcId,
    });

    // Create the SPA website resources
    new SPAWebsiteConstruct(this, `${name}Website`, {
      domainName: webDomain,
      name: "www",
      cert: cert,
      hostedZone: hostedZone,
    });

    // Create the API resources
    new ApiConstruct(this, `${name}Api`, {
      domainName: apiDomain,
      name: "api",
      instanceName: "open-ice",
      cert: cert,
      hostedZone: hostedZone,
      instanceType: apiInstanceType,
      storageSizeGiB: apiInstanceStorageSizeGiB,
      vpc: vpc,
      keyPair: keyPair,
    });
  }
}
