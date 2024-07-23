import * as cdk from "aws-cdk-lib"
import { Template } from "aws-cdk-lib/assertions"
import { CdkTestTemplateStack } from "../../lib/cdk-test-template-stack"

// example test. To run these tests, uncomment this file along with the
// example resource in lib/cdk-test-template-stack.ts
describe("assertion test", () => {
  let template: Template
  // テストの確認対象となるスタック・テンプレートを生成
  beforeAll(() => {
    const app = new cdk.App()
    const stack = new CdkTestTemplateStack(app, "SampleStack", {
      env: { account: "012345678901", region: "ap-northeast-1" },
    })
    template = Template.fromStack(stack)
  })

  test("全てのバケットでスタック削除時にアクセスログバケットが削除される", () => {
    template.hasResource("AWS::S3::Bucket", {
      DeletionPolicy: "Delete",
    })
  })
})
