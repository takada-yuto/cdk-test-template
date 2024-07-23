import * as cdk from "aws-cdk-lib"
import {
  CloudFrontWebDistribution,
  FunctionCode,
  FunctionEventType,
  FunctionRuntime,
  OriginAccessIdentity,
} from "aws-cdk-lib/aws-cloudfront"
import { AnyPrincipal, Effect, PolicyStatement } from "aws-cdk-lib/aws-iam"
import { BlockPublicAccess, Bucket, ObjectOwnership } from "aws-cdk-lib/aws-s3"
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment"
import { Construct } from "constructs"
import { readFileSync } from "fs"
import path = require("path")
// import * as sqs from 'aws-cdk-lib/aws-sqs';

// AWS CDKを使用してCloudFormationスタックを定義するクラス
export class CdkTestTemplateStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // フロントエンドの静的ファイルをホストするためのS3バケットを作成
    const cdkTemplateFrontendBucket = new Bucket(
      this,
      "CdkTemplateFrontendBucket",
      {
        websiteIndexDocument: "index.html",
        publicReadAccess: true,
        autoDeleteObjects: true,
        blockPublicAccess: BlockPublicAccess.BLOCK_ACLS,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    )

    // CloudFrontのログを保存するためのS3バケットを作成
    const cdkTemplateLogBucket = new Bucket(this, "CdkTemplateLogBucket", {
      objectOwnership: ObjectOwnership.BUCKET_OWNER_PREFERRED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    })

    // S3バケットへのアクセスを許可するIAMポリシーステートメントを作成
    const policyStatement = new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ["s3:GetObject"],
      principals: [new AnyPrincipal()],
      resources: [cdkTemplateFrontendBucket.arnForObjects("*")],
    })
    cdkTemplateFrontendBucket.addToResourcePolicy(policyStatement)

    // CloudFrontからS3バケットへのアクセスを許可するためのOAIを作成
    const cdkTemplateOAI = new OriginAccessIdentity(
      this,
      "CdkTemplateFrontendOAI"
    )
    cdkTemplateFrontendBucket.grantRead(cdkTemplateOAI)

    // CloudFrontにリクエストが来た際にIP制限を行うCloudFront Functionを作成
    const ipRestrictionFunction = new cdk.aws_cloudfront.Function(
      this,
      "ipRestrictionFunction",
      {
        code: FunctionCode.fromInline(
          readFileSync("./lambda/ip-restriction.js", "utf8")
        ),
        runtime: FunctionRuntime.JS_2_0,
      }
    )

    // CloudFrontディストリビューションを作成し、上記で作成したS3バケットとFunctionを関連付ける
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
            behaviors: [
              {
                isDefaultBehavior: true,
                functionAssociations: [
                  {
                    eventType: FunctionEventType.VIEWER_REQUEST,
                    function: ipRestrictionFunction,
                  },
                ],
              },
            ],
          },
        ],
        // 案件によってログ出力先を適宜変更
        loggingConfig: {
          bucket: cdkTemplateLogBucket,
          prefix: "cloudfront/front",
        },
      }
    )

    // CloudFrontディストリビューションを介してフロントエンドの静的ファイルをデプロイする
    new BucketDeployment(this, "CdkTemplateFrontendBucketDeployment", {
      sources: [Source.asset(path.resolve(__dirname, "../frontend/out"))],
      destinationBucket: cdkTemplateFrontendBucket,
      distribution: distribution,
      distributionPaths: ["/*"],
    })

    // CloudFrontディストリビューションのドメイン名を出力
    new cdk.CfnOutput(this, "CdkTemplateFrontendWebDestributionName", {
      value: distribution.distributionDomainName,
    })
  }
}
