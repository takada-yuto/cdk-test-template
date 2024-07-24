import * as cdk from "aws-cdk-lib"
import {
  CloudFrontWebDistribution,
  FunctionCode,
  FunctionEventType,
  FunctionRuntime,
  OriginAccessIdentity,
} from "aws-cdk-lib/aws-cloudfront"
import {
  AnyPrincipal,
  Effect,
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam"
import { Code, Runtime } from "aws-cdk-lib/aws-lambda"
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs"
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

    // CloudFrontのログを保存するためのS3バケットを作成
    const cdkTemplateLogBucket = new Bucket(this, "CdkTemplateLogBucket", {
      objectOwnership: ObjectOwnership.BUCKET_OWNER_PREFERRED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    })
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
        serverAccessLogsBucket: cdkTemplateLogBucket,
        serverAccessLogsPrefix: "frontend-bucket-access-logs/",
      }
    )

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

    // CloudFrontディストリビューションのドメイン名を出力
    new cdk.CfnOutput(this, "CdkTemplateFrontendWebDestributionName", {
      value: distribution.distributionDomainName,
    })

    // Lambda関数のIAMロールを作成
    const lambdaRole = new Role(this, "LambdaExecutionRole", {
      assumedBy: new ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        ),
      ],
    })

    // Lambda関数を作成
    const lambda = new NodejsFunction(this, "TestTemplateLambda", {
      entry: "lambda/index.ts",
      handler: "handler",
      runtime: Runtime.NODEJS_20_X,
      role: lambdaRole,
      logRetention: cdk.aws_logs.RetentionDays.ONE_WEEK,
    })
    // API Gatewayの設定
    const api = new cdk.aws_apigateway.RestApi(this, "LambdaApi", {
      restApiName: "Lambda Service",
      defaultCorsPreflightOptions: {
        allowOrigins: cdk.aws_apigateway.Cors.ALL_ORIGINS,
        allowMethods: cdk.aws_apigateway.Cors.ALL_METHODS,
      },
    })

    // Lambda統合
    const getLambdaIntegration = new cdk.aws_apigateway.LambdaIntegration(
      lambda
    )
    api.root.addMethod("GET", getLambdaIntegration)

    // CloudFrontディストリビューションを介してフロントエンドの静的ファイルをデプロイする
    new BucketDeployment(this, "CdkTemplateFrontendBucketDeployment", {
      sources: [
        Source.asset(path.resolve(__dirname, "../frontend/out")),
        Source.jsonData("env.json", { apigatewayUrl: api.url }),
      ],
      destinationBucket: cdkTemplateFrontendBucket,
      distribution: distribution,
      distributionPaths: ["/*"],
    })

    // API Gatewayエンドポイントを出力
    new cdk.CfnOutput(this, "APIGatewayUrl", {
      value: api.url,
    })
  }
}
