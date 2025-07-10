import { Duration, RemovalPolicy, aws_s3 as s3, Stack, StackProps } from 'aws-cdk-lib';
import { AllowedMethods, Distribution, HttpVersion, OriginAccessIdentity, PriceClass, ViewerProtocolPolicy } from 'aws-cdk-lib/aws-cloudfront';
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { Certificate, ICertificate } from 'aws-cdk-lib/aws-certificatemanager';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { ARecord, HostedZone, IHostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';

import { Construct } from 'constructs';
import { Bucket } from 'aws-cdk-lib/aws-s3';


interface SPAWebsiteProps {
  domainName: string;
  name: string;
  cert: ICertificate;
  hostedZone: IHostedZone;
}

export class SPAWebsiteConstruct extends Construct {
  public readonly webBucket: Bucket;

  constructor(scope: Construct, id: string, props: SPAWebsiteProps) {
    super(scope, id);

    const { domainName, name, cert, hostedZone } = props;

    const originAccessIdentity = new OriginAccessIdentity(this, 'WebIdentity');
    
    this.webBucket = new s3.Bucket(this, 'WebBucket', {
      accessControl: s3.BucketAccessControl.PRIVATE,
      bucketName: domainName,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    this.webBucket.grantRead(originAccessIdentity);
    const s3origin = new S3Origin(this.webBucket, {
      originId: domainName,
      originAccessIdentity: originAccessIdentity,
    });
    
    const cf = new Distribution(this, 'WebDistribution', {
      defaultRootObject: 'index.html',
      priceClass: PriceClass.PRICE_CLASS_100,
      httpVersion: HttpVersion.HTTP2_AND_3,
      domainNames: [domainName],
      certificate: cert,
      defaultBehavior: {
        origin: s3origin,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: {
          // default caching policy
          cachePolicyId: '658327ea-f89d-4fab-a63d-7e88639e58f6',
        },
        compress: true,
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
      },
      additionalBehaviors: {
        "index.html": {
          origin: s3origin,
          viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          
        cachePolicy: {
          // index.html caching policy
          cachePolicyId: '20026d86-d200-4998-8e79-a4f0a1bc247b',
        },
        compress: true,
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
        },
      },
      errorResponses: [
        {
          httpStatus: 404,
          ttl: Duration.seconds(60),
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        }
      ],
    });

    // Add an A record to the hosted zone that points to the CloudFront distribution
    new ARecord(this, 'WebAliasRecord', {
      zone: hostedZone,
      recordName: name,
      target: RecordTarget.fromAlias(new CloudFrontTarget(cf)),
    });

  }
}