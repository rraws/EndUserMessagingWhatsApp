# EndUserMessagingWhatsApp

## Deploy the application

```bash
sam build
sam deploy --guided
```

The first command will build the source of your application. The second command will package and deploy your application to AWS, with a series of prompts:

* **Stack Name**: `EndUserMessagingWhatsApp`
* **AWS Region**: The AWS region you want to deploy your app to.
* **Confirm changes before deploy**: `N`
* **Allow SAM CLI IAM role creation**: `Y` 
* **Save arguments to samconfig.toml**: `Y`

## Generate Cfn template

In order to simplify deployment and remove SAM dependencies, follow these steps to create a Cfn template and a deployable artifact.
As a prerequisite, you should have deployed the application as a SAM application

1. Generate the Cfn template by running the command below. You might also have to pass depending on `--s3-bucket AWS-SAM-CLI-MANAGED-BUCKET-NAME`
```shell
sam package  --output-template-file cfn/cfn-template.yaml 

```
2. Create the deployable artifact for the function:
```shell
cd .aws-sam/build/WhatsAppMessageHandlerFunction
zip  -r ../../../cfn/code.zip .
cd -
```
3. Replace the `CodeUri` in the [cfn-template.yaml](cfn/cfn-template.yaml) with the correct release link. Replace the `v0.0.1` with the version that you plan to release. 
```shell
https://github.com/rr-on-gh/EndUserMessagingWhatsApp/releases/download/v0.0.1/code.zip
```
4. Commit and push all the changes
5. Create a new [release](https://github.com/rr-on-gh/EndUserMessagingWhatsApp/releases/new) on github

## Cleanup

To delete the sample application that you created, use the AWS CLI. Assuming you used your project name for the stack name, you can run the following:

```bash
sam delete --stack-name EndUserMessagingWhatsApp
```
