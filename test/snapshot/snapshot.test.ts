import * as cdk from "aws-cdk-lib"
import { Template } from "aws-cdk-lib/assertions"
import { CdkTestTemplateStack } from "../../lib/cdk-test-template-stack"

// example test. To run these tests, uncomment this file along with the
// example resource in lib/cdk-test-template-stack.ts
test("snapshot test", () => {
  const app = new cdk.App()
  // WHEN
  const stack = new CdkTestTemplateStack(app, "MyTestStack")
  // THEN
  const template = Template.fromStack(stack)

  expect(template).toMatchSnapshot()
})
