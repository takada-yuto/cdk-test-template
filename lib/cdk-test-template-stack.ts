import * as cdk from "aws-cdk-lib"
import {
  CloudFrontWebDistribution,
  OriginAccessIdentity,
} from "aws-cdk-lib/aws-cloudfront"
import { AnyPrincipal, Effect, PolicyStatement } from "aws-cdk-lib/aws-iam"
import { BlockPublicAccess, Bucket } from "aws-cdk-lib/aws-s3"
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment"
import { Construct } from "constructs"
import path = require("path")
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class CdkTestTemplateStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const cdkTemplateFrontendBucket = new Bucket(
      this,
      "CdkTemplateFrontendFrontendBucket",
      {
        websiteIndexDocument: "index.html",
        publicReadAccess: true,
        autoDeleteObjects: true,
        blockPublicAccess: BlockPublicAccess.BLOCK_ACLS,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    )

    const policyStatement = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["s3:GetObject"],
      principals: [new AnyPrincipal()],
      resources: [cdkTemplateFrontendBucket.arnForObjects("*")],
    })

    cdkTemplateFrontendBucket.addToResourcePolicy(policyStatement)

    const cdkTemplateOAI = new OriginAccessIdentity(
      this,
      "CdkTemplateFrontendOAI"
    )

    cdkTemplateFrontendBucket.grantRead(cdkTemplateOAI)

    const distribution = new CloudFrontWebDistribution(
      this,
      "CdkTemplateFrontendWebDestribution",
      {
        originConfigs: [
          {
            s3OriginSource: {
              s3BucketSource: cdkTemplateFrontendBucket,
              originAccessIdentity: cdkTemplateOAI,
            },
            behaviors: [{ isDefaultBehavior: true }],
          },
        ],
      }
    )

    new BucketDeployment(this, "CdkTemplateFrontendBucketDeployment", {
      sources: [Source.asset(path.resolve(__dirname, "../frontend/out"))],
      destinationBucket: cdkTemplateFrontendBucket,
      distribution: distribution,
      distributionPaths: ["/*"],
    })

    new cdk.CfnOutput(this, "CdkTemplateFrontendWebDestributionName", {
      value: distribution.distributionDomainName,
    })
  }
}
