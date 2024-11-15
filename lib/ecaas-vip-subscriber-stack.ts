import { Duration, Stack, StackProps } from "aws-cdk-lib";
import * as events from "aws-cdk-lib/aws-events";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as iam from "aws-cdk-lib/aws-iam";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as eventtargets from "aws-cdk-lib/aws-events-targets";
import { Construct } from "constructs";

export class EcaasVipSubscriberStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const rule = new events.Rule(this, "rule", {
      eventPattern: {
        source: ["myCustomEvent"],
      },
    });

    const lambdaVpc = ec2.Vpc.fromLookup(this, "ExistingVpc", {
      vpcId: "vpc-053251e6ef627f0e4",
    });

    //Role for lambda function
    // const myRole = new iam.Role(this, "lambdaRole", {
    //   assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    //   roleName: "myRole",
    //   path: "/",
    //   permissionsBoundary: iam.ManagedPolicy.fromManagedPolicyArn(
    //     this,
    //     "Boundary",
    //     "arn:aws:iam::739632194968:policy/cops-teamadmin-permission-boundary"
    //   ),
    //   inlinePolicies: {
    //     root: new iam.PolicyDocument({
    //       statements: [
    //         new iam.PolicyStatement({
    //           actions: [
    //             "logs:CreateLogGroup",
    //             "logs:CreateLogStream",
    //             "logs:PutLogEvents",
    //           ],
    //           resources: ["*"],
    //         }),
    //       ],
    //     }),
    //   },
    // });

    // //Managed policy for the lambda function
    // myRole.addManagedPolicy(
    //   iam.ManagedPolicy.fromManagedPolicyArn(
    //     this,
    //     "LambdaBasicPolicy",
    //     "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
    //   )
    // );

    // //Managed policy for the lambda function
    // myRole.addManagedPolicy(
    //   iam.ManagedPolicy.fromManagedPolicyArn(
    //     this,
    //     "LambdaVPC",
    //     "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
    //   )
    // );

    // const table = new dynamodb.Table(this, "JiraAssetMapping", {
    //   tableName: "JiraAssetMapping",
    //   partitionKey: {
    //     name: "ProdUnit_FctyCode_AssetCode",
    //     type: dynamodb.AttributeType.STRING,
    //   },
    //   // sortKey: {
    //   //   name: "JiraAsset",
    //   //   type: dynamodb.AttributeType.STRING,
    //   // },
    // });

    // const table = new dynamodb.CfnTable(this, "JiraAssetMapping", {
    //   keySchema: [
    //     {
    //       attributeName: "ProdUnit_FctyCode_AssetCode",
    //       keyType: "HASH",
    //     },
    //   ],
    //   tableName: "JiraAssetMapping",
    //   provisionedThroughput: {
    //     readCapacityUnits: 123,
    //     writeCapacityUnits: 123,
    //   },
    //   attributeDefinitions: [
    //     {
    //       attributeName: "JiraAsset",
    //       attributeType: "S",
    //     },
    //   ],
    // });

    //Lambda function
    const lambdaFunction = new lambda.Function(this, "VipSubscriber", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset("lambdas"),
      timeout: Duration.seconds(30),
      handler: "request-handler.handler",
      vpc: lambdaVpc,
    });

    rule.addTarget(
      new eventtargets.LambdaFunction(lambdaFunction, {
        maxEventAge: Duration.hours(2),
      })
    );
  }
}
