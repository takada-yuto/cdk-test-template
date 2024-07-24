#!/usr/bin/env node
import "source-map-support/register"
import * as cdk from "aws-cdk-lib"
import { CdkTestTemplateStack } from "../lib/cdk-test-template-stack"
// import { AwsSolutionsChecks } from "cdk-nag"

const app = new cdk.App()
new CdkTestTemplateStack(app, "CdkTestTemplateStack", {})
// ルールの確認とカスタムルールの作成が必要そう
// cdk.Aspects.of(app).add(new AwsSolutionsChecks())
