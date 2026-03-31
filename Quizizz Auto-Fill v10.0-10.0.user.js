// ==UserScript==
// @name         Quizizz Auto-Fill v10.0
// @namespace    http://tampermonkey.net/
// @version      10.0
// @description  Auto-fill Quizizz - Batch + auto reload + retry + bypass reload popup
// @author       anonyloveme
// @match        https://wayground.com/admin/quiz/*/edit*
// @match        https://wayground.com/admin/quiz/*
// @match        https://quizizz.com/admin/quiz/*
// @updateURL    https://raw.githubusercontent.com/anonyloveme/quizizz-autofill/main/quizizz-autofill.user.js
// @downloadURL  https://raw.githubusercontent.com/anonyloveme/quizizz-autofill/main/quizizz-autofill.user.js
// @grant        none
// @run-at       document-start
// ==/UserScript==


(function () {
'use strict';

// ============================================================
// [BLOCK 0] ANTI-DEBUGGER
// ============================================================
(function installAntiDebugger() {
  const stripDebugger = (code) => {
    if (typeof code !== 'string') return code;
    return code.replace(/debugger\s*;?/g, '');
  };
  const _OriginalFunction = window.Function;
  window.Function = new Proxy(_OriginalFunction, {
    apply(target, thisArg, args) {
      return target.apply(thisArg, args.map(stripDebugger));
    },
    construct(target, args) {
      return new target(...args.map(stripDebugger));
    }
  });
  window.eval = new Proxy(window.eval, {
    apply(target, thisArg, args) {
      return target.apply(thisArg, args.map(stripDebugger));
    }
  });
  const _st = window.setTimeout;
  window.setTimeout = function(fn, d, ...a) {
    if (typeof fn === 'string') fn = stripDebugger(fn);
    return _st.call(window, fn, d, ...a);
  };
  const _si = window.setInterval;
  window.setInterval = function(fn, d, ...a) {
    if (typeof fn === 'string') fn = stripDebugger(fn);
    if (typeof fn === 'function' && fn.toString().includes('debugger')) {
      const body = fn.toString()
        .replace(/^[^{]*\{/, '')
        .replace(/\}[^}]*$/, '');
      fn = new _OriginalFunction(stripDebugger(body));
    }
    return _si.call(window, fn, d, ...a);
  };

  // Chặn beforeunload popup ngay từ đầu
  window.addEventListener('beforeunload', (e) => {
    e.stopImmediatePropagation();
    delete e.returnValue;
  }, { capture: true });

  console.log('%c[AntiDebugger] ✅ OK', 'color:#0f0;font-weight:bold');
})();

// ============================================================
// CONFIGURATION
// ============================================================
const BATCH_SIZE      = 5;
const START_FROM      = 0;
const AUTO_START      = true;
const MAX_RETRY       = 5;
const RETRY_WAIT_SEC  = 30;
const RELOAD_WAIT_SEC = 20;

// ============================================================
// DATA — PASTE MẢNG questions CỦA BẠN VÀO ĐÂY
// ============================================================
const questions = [
{question:"A company plans to use an Amazon Snowball Edge device to transfer files to the AWS Cloud.\nWhich activities related to a Snowball Edge device are available to the company at no cost?",options:["Use of the Snowball Edge appliance for a 10-day period","The transfer of data out of Amazon S3 and to the Snowball Edge appliance","The transfer of data from the Snowball Edge appliance into Amazon S3","Daily use of the Snowball Edge appliance after 10 days"],answer:[0],is_multi:false},
{question:"AWS CerA company has deployed applications on Amazon EC2 instances. The company needs to assess application vulnerabilities and must identify infrastructure deployments that do not meet best practices.\nWhich AWS service can the company use to meA company has deployed applications on Amazon EC2 instances. The company needs to assess application vulnerabilities and must identify infrastructure deployments that do not meet best practices.\nWhich AWS service can the company use to meet these requirements?et these requirements?tified Cloud Practitioner",options:["AWS Trusted Advisor","Amazon Inspector","AWS Config","Amazon GuardDuty"],answer:[1],is_multi:false},
{question:"A company has a centralized group of users with large file storage requirements that have exceeded the space available on premises. The company wants to extend its file storage capabilities for this group while retaining the performance benefit of sharing content locally.\nWhat is the MOST operationally efficient AWS solution for this scenario?",options:["Create an Amazon S3 bucket for each user. Mount each bucket by using an S3 file system mounting utility.","Configure and deploy an AWS Storage Gateway file gateway. Connect each user's workstation to the file gateway.","Move each user's working environment to Amazon WorkSpaces. Set up an Amazon WorkDocs account for each user.","Deploy an Amazon EC2 instance and attach an Amazon Elastic Block Store (Amazon EBS) Provisioned IOPS volume. Share the EBS volume directly with the users."],answer:[1],is_multi:false},
{question:"According to security best practices, how should an Amazon EC2 instance be given access to an Amazon S3 bucket?",options:["Hard code an IAM user's secret key and access key directly in the application, and upload the file.","Store the IAM user's secret key and access key in a text file on the EC2 instance, read the keys, then upload the file.","Have the EC2 instance assume a role to obtain the privileges to upload the file.","Modify the S3 bucket policy so that any service can upload to it at any time."],answer:[2],is_multi:false},
{question:"Which option is a customer responsibility when using Amazon DynamoDB under the AWS Shared Responsibility Model?",options:["Physical security of DynamoDB","Patching of DynamoDB","Access to DynamoDB tables","Encryption of data at rest in DynamoDB"],answer:[2],is_multi:false},
{question:"Which option is a perspective that includes foundational capabilities of the AWS Cloud Adoption Framework (AWS CAF)?",options:["Sustainability","Performance efficiency","Governance","Reliability"],answer:[2],is_multi:false},
{question:"A company is running and managing its own Docker environment on Amazon EC2 instances. The company wants an alternative to help manage cluster size, scheduling, and environment maintenance.\nWhich AWS service meets these requirements?",options:["AWS Lambda","Amazon RDS","AWS Fargate","Amazon Athena"],answer:[2],is_multi:false},
{question:"A company wants to run a NoSQL database on Amazon EC2 instances.\nWhich task is the responsibility of AWS in this scenario?",options:["Update the guest operating system of the EC2 instances.","Maintain high availability at the database layer.","Patch the physical infrastructure that hosts the EC2 instances.","Configure the security group firewall."],answer:[2],is_multi:false},
{question:"Which AWS services or tools can identify rightsizing opportunities for Amazon EC2 instances? (Choose two.)",options:["AWS Cost Explorer","AWS Billing Conductor","Amazon CodeGuru","Amazon SageMaker","AWS Compute Optimizer"],answer:[0,4],is_multi:true},
{question:"Which of the following are benefits of using AWS Trusted Advisor? (Choose two.)",options:["Providing high-performance container orchestration","Creating and rotating encryption keys","Detecting underutilized resources to save costs","Improving security by proactively monitoring the AWS environment","Implementing enforced tagging across AWS resources"],answer:[2,3],is_multi:true},
{question:"Which of the following is an advantage that users experience when they move on-premises workloads to the AWS Cloud?",options:["Elimination of expenses for running and maintaining data centers","Price discounts that are identical to discounts from hardware providers","Distribution of all operational controls to AWS","Elimination of operational expenses"],answer:[0],is_multi:false},
{question:"A company wants to manage deployed IT services and govern its infrastructure as code (IaC) templates.\nWhich AWS service will meet this requirement?",options:["AWS Resource Explorer","AWS Service Catalog","AWS Organizations","AWS Systems Manager"],answer:[1],is_multi:false},
{question:"Which AWS service or tool helps users visualize, understand, and manage spending and usage over time?",options:["AWS Organizations","AWS Pricing Calculator","AWS Cost Explorer","AWS Service Catalog"],answer:[2],is_multi:false},
{question:"A company is using a central data platform to manage multiple types of data for its customers. The company wants to use AWS services to discover, transform, and visualize the data.\nWhich combination of AWS services should the company use to meet these requirements? (Choose two.)",options:["AWS Glue","Amazon Elastic File System (Amazon EFS)","Amazon Redshift","Amazon QuickSight","Amazon Quantum Ledger Database (Amazon QLDB)"],answer:[0,3],is_multi:true},
{question:"A global company wants to migrate its third-party applications to the AWS Cloud. The company wants help from a global team of experts to complete the migration faster and more reliably in accordance with AWS internal best practices.\nWhich AWS service or resource will meet these requirements?",options:["AWS Support","AWS Professional Services","AWS Launch Wizard","AWS Managed Services (AMS)"],answer:[1],is_multi:false},
{question:"An e-learning platform needs to run an application for 2 months each year. The application will be deployed on Amazon EC2 instances. Any application downtime during those 2 months must be avoided.\nWhich EC2 purchasing option will meet these requirements MOST cost-effectively?",options:["Reserved Instances","Dedicated Hosts","Spot Instances","On-Demand Instances"],answer:[3],is_multi:false},
{question:"A developer wants to deploy an application quickly on AWS without manually creating the required resources.\nWhich AWS service will meet these requirements?",options:["Amazon EC2","AWS Elastic Beanstalk","AWS CodeBuild","Amazon Personalize"],answer:[1],is_multi:false},
{question:"A company is storing sensitive customer data in an Amazon S3 bucket. The company wants to protect the data from accidental deletion or overwriting.\nWhich S3 feature should the company use to meet these requirements?",options:["S3 Lifecycle rules","S3 Versioning","S3 bucket policies","S3 server-side encryption"],answer:[1],is_multi:false},
{question:"Which AWS service provides the ability to manage infrastructure as code?",options:["AWS CodePipeline","AWS CodeDeploy","AWS Direct Connect","AWS CloudFormation"],answer:[3],is_multi:false},
{question:"An online gaming company needs to choose a purchasing option to run its Amazon EC2 instances for 1 year. The web traffic is consistent, and any increases in traffic are predictable. The EC2 instances must be online and available without any disruption.\nWhich EC2 instance purchasing option will meet these requirements MOST cost-effectively?",options:["On-Demand Instances","Reserved Instances","Spot Instances","Spot Fleet"],answer:[1],is_multi:false},
{question:"Which AWS service or feature allows a user to establish a dedicated network connection between a company's on-premises data center and the AWS Cloud?",options:["AWS Direct Connect","VPC peering","AWS VPN","Amazon Route 53"],answer:[0],is_multi:false},
{question:"Which option is a physical location of the AWS global infrastructure?",options:["AWS DataSync","AWS Region","Amazon Connect","AWS Organizations"],answer:[1],is_multi:false},
{question:"A company wants to protect its AWS Cloud information, systems, and assets while performing risk assessment and mitigation tasks.\nWhich pillar of the AWS Well-Architected Framework is supported by these goals?",options:["Reliability","Security","Operational excellence","Performance efficiency"],answer:[1],is_multi:false},
{question:"What is the purpose of having an internet gateway within a VPC?",options:["To create a VPN connection to the VPC","To allow communication between the VPC and the internet","To impose bandwidth constraints on internet traffic","To load balance traffic from the internet across Amazon EC2 instances"],answer:[1],is_multi:false},
{question:"A company is running a monolithic on-premises application that does not scale and is difficult to maintain. The company has a plan to migrate the application to AWS and divide the application into microservices.\nWhich best practice of the AWS Well-Architected Framework is the company following with this plan?",options:["Integrate functional testing as part of AWS deployment.","Use automation to deploy changes.","Deploy the application to multiple locations.","Implement loosely coupled dependencies."],answer:[3],is_multi:false},
{question:"A company has an AWS account. The company wants to audit its password and access key rotation details for compliance purposes.\nWhich AWS service or tool will meet this requirement?",options:["IAM Access Analyzer","AWS Artifact","IAM credential report","AWS Audit Manager"],answer:[2],is_multi:false},
{question:"A company wants to receive a notification when a specific AWS cost threshold is reached.\nWhich AWS services or tools can the company use to meet this requirement? (Choose two.)",options:["Amazon Simple Queue Service (Amazon SQS)","AWS Budgets","Cost Explorer","Amazon CloudWatch","AWS Cost and Usage Report"],answer:[1,3],is_multi:true},
{question:"Which AWS service or resource provides answers to the most frequently asked security-related questions that AWS receives from its users?",options:["AWS Artifact","Amazon Connect","AWS Chatbot","AWS Knowledge Center"],answer:[3],is_multi:false},
{question:"Which tasks are customer responsibilities, according to the AWS shared responsibility model? (Choose two.)",options:["Configure the AWS provided security group firewall.","Classify company assets in the AWS Cloud.","Determine which Availability Zones to use for Amazon S3 buckets.","Patch or upgrade Amazon DynamoDB.","Select Amazon EC2 instances to run AWS Lambda on."],answer:[0,1],is_multi:true},
{question:"Which of the following are pillars of the AWS Well-Architected Framework? (Choose two.)",options:["Availability","Reliability","Scalability","Responsive design","Operational excellence"],answer:[1,4],is_multi:true},
{question:"Which AWS service or feature is used to send both text and email messages from distributed applications?",options:["Amazon Simple Notification Service (Amazon SNS)","Amazon Simple Email Service (Amazon SES)","Amazon CloudWatch alerts","Amazon Simple Queue Service (Amazon SQS)"],answer:[0],is_multi:false},
{question:"A user needs programmatic access to AWS resources through the AWS CLI or the AWS API.\nWhich option will provide the user with the appropriate access?",options:["Amazon Inspector","Access keys","SSH public keys","AWS Key Management Service (AWS KMS) keys"],answer:[1],is_multi:false},
{question:"A company runs thousands of simultaneous simulations using AWS Batch. Each simulation is stateless, is fault tolerant, and runs for up to 3 hours.\nWhich pricing model enables the company to optimize costs and meet these requirements?",options:["Reserved Instances","Spot Instances","On-Demand Instances","Dedicated Instances"],answer:[1],is_multi:false},
{question:"What does the concept of agility mean in AWS Cloud computing? (Choose two.)",options:["The speed at which AWS resources are implemented","The speed at which AWS creates new AWS Regions","The ability to experiment quickly","The elimination of wasted capacity","The low cost of entry into cloud computing"],answer:[0,2],is_multi:true},
{question:"A company needs to block SQL injection attacks.\nWhich AWS service or feature can meet this requirement?",options:["AWS WAF","AWS Shield","Network ACLs","Security groups"],answer:[0],is_multi:false},
{question:"Which AWS service or feature identifies whether an Amazon S3 bucket or an IAM role has been shared with an external entity?",options:["AWS Service Catalog","AWS Systems Manager","AWS IAM Access Analyzer","AWS Organizations"],answer:[2],is_multi:false},
{question:"A cloud practitioner needs to obtain AWS compliance reports before migrating an environment to the AWS Cloud.\nHow can these reports be generated?",options:["Contact the AWS Compliance team.","Download the reports from AWS Artifact.","Open a case with AWS Support.","Generate the reports with Amazon Macie."],answer:[1],is_multi:false},
{question:"An ecommerce company has migrated its IT infrastructure from an on-premises data center to the AWS Cloud.\nWhich cost is the company's direct responsibility?",options:["Cost of application software licenses","Cost of the hardware infrastructure on AWS","Cost of power for the AWS servers","Cost of physical security for the AWS data center"],answer:[0],is_multi:false},
{question:"A company is setting up AWS Identity and Access Management (IAM) on an AWS account.\nWhich recommendation complies with IAM security best practices?",options:["Use the account root user access keys for administrative tasks.","Grant broad permissions so that all company employees can access the resources they need.","Turn on multi-factor authentication (MFA) for added security during the login process.","Avoid rotating credentials to prevent issues in production applications."],answer:[2],is_multi:false},
{question:"Elasticity in the AWS Cloud refers to which of the following? (Choose two.)",options:["How quickly an Amazon EC2 instance can be restarted","The ability to rightsize resources as demand shifts","The maximum amount of RAM an Amazon EC2 instance can use","The pay-as-you-go billing model","How easily resources can be procured when they are needed"],answer:[1,4],is_multi:true},
{question:"Which service enables customers to audit API calls in their AWS accounts?",options:["AWS CloudTrail","AWS Trusted Advisor","Amazon Inspector","AWS X-Ray"],answer:[0],is_multi:false},
{question:"What is a customer responsibility when using AWS Lambda according to the AWS shared responsibility model?",options:["Managing the code within the Lambda function","Confirming that the hardware is working in the data center","Patching the operating system","Shutting down Lambda functions when they are no longer in use"],answer:[0],is_multi:false},
{question:"A company has 5 TB of data stored in Amazon S3. The company plans to occasionally run queries on the data for analysis.\nWhich AWS service should the company use to run these queries in the MOST cost-effective manner?",options:["Amazon Redshift","Amazon Athena","Amazon Kinesis","Amazon RDS"],answer:[1],is_multi:false},
{question:"Which AWS service can be used at no additional cost?",options:["Amazon SageMaker","AWS Config","AWS Organizations","Amazon CloudWatch"],answer:[2],is_multi:false},
{question:"Which AWS Cloud Adoption Framework (AWS CAF) capability belongs to the people perspective?",options:["Data architecture","Event management","Cloud fluency","Strategic partnership"],answer:[2],is_multi:false},
{question:"A company wants to make an upfront commitment for continued use of its production Amazon EC2 instances in exchange for a reduced overall cost.\nWhich pricing options meet these requirements with the LOWEST cost? (Choose two.)",options:["Spot Instances","On-Demand Instances","Reserved Instances","Savings Plans","Dedicated Hosts"],answer:[2,3],is_multi:true},
{question:"A company wants to migrate its on-premises relational databases to the AWS Cloud. The company wants to use infrastructure as close to its current geographical location as possible.\nWhich AWS service or resource should the company use to select its Amazon RDS deployment area?",options:["Amazon Connect","AWS Wavelength","AWS Regions","AWS Direct Connect"],answer:[2],is_multi:false},
{question:"A company is exploring the use of the AWS Cloud, and needs to create a cost estimate for a project before the infrastructure is provisioned.\nWhich AWS service or feature can be used to estimate costs before deployment?",options:["AWS Free Tier","AWS Pricing Calculator","AWS Billing and Cost Management","AWS Cost and Usage Report"],answer:[1],is_multi:false},
{question:"A company is building an application that needs to deliver images and videos globally with minimal latency.\nWhich approach can the company use to accomplish this in a cost effective manner?",options:["Deliver the content through Amazon CloudFront.","Store the content on Amazon S3 and enable S3 cross-region replication.","Implement a VPN across multiple AWS Regions.","Deliver the content through AWS PrivateLink."],answer:[0],is_multi:false},
{question:"Which option is a benefit of the economies of scale based on the advantages of cloud computing?",options:["The ability to trade variable expense for fixed expense","Increased speed and agility","Lower variable costs over fixed costs","Increased operational costs across data centers"],answer:[2],is_multi:false},
{question:"Which of the following is a software development framework that a company can use to define cloud resources as code and provision the resources through AWS CloudFormation?",options:["AWS CLI","AWS Developer Center","AWS Cloud Development Kit (AWS CDK)","AWS CodeStar"],answer:[2],is_multi:false},
{question:"A company is developing an application that uses multiple AWS services. The application needs to use temporary, limited-privilege credentials for authentication with other AWS APIs.\nWhich AWS service or feature should the company use to meet these authentication requirements?",options:["Amazon API Gateway","IAM users","AWS Security Token Service (AWS STS)","IAM instance profiles"],answer:[2],is_multi:false},
{question:"Which AWS service is a cloud security posture management (CSPM) service that aggregates alerts from various AWS services and partner products in a standardized format?",options:["AWS Security Hub","AWS Trusted Advisor","Amazon EventBridge","Amazon GuardDuty"],answer:[0],is_multi:false},
{question:"Which AWS service is always provided at no charge?",options:["Amazon S3","AWS Identity and Access Management (IAM)","Elastic Load Balancers","AWS WAF"],answer:[1],is_multi:false},
{question:"To reduce costs, a company is planning to migrate a NoSQL database to AWS.\nWhich AWS service is fully managed and can automatically scale throughput capacity to meet database workload demands?",options:["Amazon Redshift","Amazon Aurora","Amazon DynamoDB","Amazon RDS"],answer:[2],is_multi:false},
{question:"A company is using Amazon DynamoDB.\nWhich task is the company's responsibility, according to the AWS shared responsibility model?",options:["Patch the operating system.","Provision hosts.","Manage database access permissions.","Secure the operating system."],answer:[2],is_multi:false},
{question:"A company has a test AWS environment. A company is planning on testing an application within AWS. The application testing can be interrupted and does not need to run continuously.\nWhich Amazon EC2 purchasing option will meet these requirements MOST cost-effectively?",options:["On-Demand Instances","Dedicated Instances","Spot Instances","Reserved Instances"],answer:[2],is_multi:false},
{question:"Which AWS service gives users the ability to discover and protect sensitive data that is stored in Amazon S3 buckets?",options:["Amazon Macie","Amazon Detective","Amazon GuardDuty","AWS IAM Access Analyzer"],answer:[0],is_multi:false},
{question:"Which of the following services can be used to block network traffic to an instance? (Choose two.)",options:["Security groups","Amazon Virtual Private Cloud (Amazon VPC) flow logs","Network ACLs","Amazon CloudWatch","AWS CloudTrail"],answer:[0,2],is_multi:true},
{question:"Which AWS service can identify when an Amazon EC2 instance was terminated?",options:["AWS Identity and Access Management (IAM)","AWS CloudTrail","AWS Compute Optimizer","Amazon EventBridge"],answer:[1],is_multi:false},
{question:"Which of the following is a fully managed MySQL-compatible database?",options:["Amazon S3","Amazon DynamoDB","Amazon Redshift","Amazon Aurora"],answer:[3],is_multi:false},
{question:"Which AWS service supports a hybrid architecture that gives users the ability to extend AWS infrastructure, AWS services, APIs, and tools to data centers, co-location environments, or on-premises facilities?",options:["AWS Snowmobile","AWS Local Zones","AWS Outposts","AWS Fargate"],answer:[2],is_multi:false},
{question:"Which AWS service can run a managed PostgreSQL database that provides online transaction processing (OLTP)?",options:["Amazon DynamoDB","Amazon Athena","Amazon RDS","Amazon EMR"],answer:[2],is_multi:false},
{question:"A company wants to provide managed Windows virtual desktops and applications to its remote employees over secure network connections.\nWhich AWS services can the company use to meet these requirements? (Choose two.)",options:["Amazon Connect","Amazon AppStream 2.0","Amazon WorkSpaces","AWS Site-to-Site VPN","Amazon Elastic Container Service (Amazon ECS)"],answer:[2,3],is_multi:true},
{question:"A company wants to monitor for misconfigured security groups that are allowing unrestricted access to specific ports.\nWhich AWS service will meet this requirement?",options:["AWS Trusted Advisor","Amazon CloudWatch","Amazon GuardDuty","AWS Health Dashboard"],answer:[0],is_multi:false},
{question:"Which AWS service is a key-value database that provides sub-millisecond latency on a large scale?",options:["Amazon DynamoDB","Amazon Aurora","Amazon DocumentDB (with MongoDB compatibility)","Amazon Neptune"],answer:[0],is_multi:false},
{question:"A company is deploying a machine learning (ML) research project that will require a lot of compute power over several months. The ML processing jobs do not need to run at specific times.\nWhich Amazon EC2 instance purchasing option will meet these requirements at the lowest cost?",options:["On-Demand Instances","Spot Instances","Reserved Instances","Dedicated Instances"],answer:[1],is_multi:false},
{question:"Which AWS services or features provide disaster recovery solutions for Amazon EC2 instances? (Choose two.)",options:["EC2 Reserved Instances","EC2 Amazon Machine Images (AMIs)","Amazon Elastic Block Store (Amazon EBS) snapshots","AWS Shield","Amazon GuardDuty"],answer:[1,2],is_multi:true},
{question:"Which AWS service provides command line access to AWS tools and resources directly from a web browser?",options:["AWS CloudHSM","AWS CloudShell","Amazon WorkSpaces","AWS Cloud Map"],answer:[1],is_multi:false},
{question:"A network engineer needs to build a hybrid cloud architecture connecting on-premises networks to the AWS Cloud using AWS Direct Connect. The company has a few VPCs in a single AWS Region and expects to increase the number of VPCs to hundreds over time.\nWhich AWS service or feature should the engineer use to simplify and scale this connectivity as the VPCs increase in number?",options:["VPC endpoints","AWS Transit Gateway","Amazon Route 53","AWS Secrets Manager"],answer:[1],is_multi:false},
{question:"A company wants to assess its operational readiness. It also wants to identify and mitigate any operational risks ahead of a new product launch.\nWhich AWS Support plan offers guidance and support for this kind of event at no additional charge?",options:["AWS Business Support","AWS Basic Support","AWS Developer Support","AWS Enterprise Support"],answer:[3],is_multi:false},
{question:"A company wants to establish a schedule for rotating database user credentials.\nWhich AWS service will support this requirement with the LEAST amount of operational overhead?",options:["AWS Systems Manager","AWS Secrets Manager","AWS License Manager","AWS Managed Services"],answer:[1],is_multi:false},
{question:"Which AWS service or feature can be used to create a private connection between an on-premises workload and an AWS Cloud workload?",options:["Amazon Route 53","Amazon Macie","AWS Direct Connect","AWS PrivateLink"],answer:[3],is_multi:false},
{question:"Which AWS service is used to provide encryption for Amazon EBS?",options:["AWS Certificate Manager","AWS Systems Manager","AWS KMS","AWS Config"],answer:[2],is_multi:false},
{question:"A company wants to manage its AWS Cloud resources through a web interface.\nWhich AWS service will meet this requirement?",options:["AWS Management Console","AWS CLI","AWS SDK","AWS Cloud9"],answer:[0],is_multi:false},
{question:"Which of the following are advantages of the AWS Cloud? (Choose two.)",options:["Trade variable expenses for capital expenses","High economies of scale","Launch globally in minutes","Focus on managing hardware infrastructure","Overprovision to ensure capacity"],answer:[1,2],is_multi:true},
{question:"Which AWS Cloud benefit is shown by an architecture's ability to withstand failures with minimal downtime?",options:["Agility","Elasticity","Scalability","High availability"],answer:[3],is_multi:false},
{question:"A developer needs to maintain a development environment infrastructure and a production environment infrastructure in a repeatable fashion.\nWhich AWS service should the developer use to meet these requirements?",options:["AWS Ground Station","AWS Shield","AWS IoT Device Defender","AWS CloudFormation"],answer:[3],is_multi:false},
{question:"Which task is the customer's responsibility, according to the AWS shared responsibility model?",options:["Maintain the security of the AWS Cloud.","Configure firewalls and networks.","Patch the operating system of Amazon RDS instances.","Implement physical and environmental controls."],answer:[1],is_multi:false},
{question:"Which AWS service helps deliver highly available applications with fast failover for multi-Region and Multi-AZ architectures?",options:["AWS WAF","AWS Global Accelerator","AWS Shield","AWS Direct Connect"],answer:[1],is_multi:false},
{question:"A company has a set of ecommerce applications. The applications need to be able to send messages to each other.\nWhich AWS service meets this requirement?",options:["AWS Auto Scaling","Elastic Load Balancing","Amazon Simple Queue Service (Amazon SQS)","Amazon Kinesis Data Streams"],answer:[2],is_multi:false},
{question:"What are the benefits of consolidated billing for AWS Cloud services? (Choose two.)",options:["Volume discounts","A minimal additional fee for use","One bill for multiple accounts","Installment payment options","Custom cost and usage budget creation"],answer:[0,2],is_multi:true},
{question:"A user wants to review all Amazon S3 buckets with ACLs and S3 bucket policies in the S3 console.\nWhich AWS service or resource will meet this requirement?",options:["S3 Multi-Region Access Points","S3 Storage Lens","AWS IAM Identity Center (AWS Single Sign-On)","Access Analyzer for S3"],answer:[3],is_multi:false},
{question:"What is the best resource for a user to find compliance-related information and reports about AWS?",options:["AWS Artifact","AWS Marketplace","Amazon Inspector","AWS Support"],answer:[0],is_multi:false},
{question:"Which AWS service enables companies to deploy an application close to end users?",options:["Amazon CloudFront","AWS Auto Scaling","AWS AppSync","Amazon Route 53"],answer:[0],is_multi:false},
{question:"Which AWS service or feature improves network performance by sending traffic through the AWS worldwide network infrastructure?",options:["Route table","AWS Transit Gateway","AWS Global Accelerator","Amazon VPC"],answer:[2],is_multi:false},
{question:"Which AWS service provides highly durable object storage?",options:["Amazon S3","Amazon Elastic File System (Amazon EFS)","Amazon Elastic Block Store (Amazon EBS)","Amazon FSx"],answer:[0],is_multi:false},
{question:"Which responsibility belongs to AWS when a company hosts its databases on Amazon EC2 instances?",options:["Database backups","Database software patches","Operating system patches","Operating system installations"],answer:[3],is_multi:false},
{question:"Which of the following are advantages of moving to the AWS Cloud? (Choose two.)",options:["The ability to turn over the responsibility for all security to AWS.","The ability to use the pay-as-you-go model.","The ability to have full control over the physical infrastructure.","No longer having to guess what capacity will be required.","No longer worrying about users access controls."],answer:[1,3],is_multi:true},
{question:"Which AWS service is a hybrid cloud storage service that provides on-premises users access to virtually unlimited cloud storage?",options:["AWS DataSync","Amazon S3 Glacier","AWS Storage Gateway","Amazon Elastic Block Store (Amazon EBS)"],answer:[2],is_multi:false},
{question:"A company plans to migrate to AWS and wants to create cost estimates for its AWS use cases.\nWhich AWS service or tool can the company use to meet these requirements?",options:["AWS Pricing Calculator","Amazon CloudWatch","AWS Cost Explorer","AWS Budgets"],answer:[0],is_multi:false},
{question:"Which tool should a developer use to integrate AWS service features directly into an application?",options:["AWS Software Development Kit","AWS CodeDeploy","AWS Lambda","AWS Batch"],answer:[0],is_multi:false},
{question:"Which of the following is a recommended design principle of the AWS Well-Architected Framework?",options:["Reduce downtime by making infrastructure changes infrequently and in large increments.","Invest the time to configure infrastructure manually.","Learn to improve from operational failures.","Use monolithic application design for centralization."],answer:[2],is_multi:false},
{question:"Using AWS Identity and Access Management (IAM) to grant access only to the resources needed to perform a task is a concept known as:",options:["restricted access.","as-needed access.","least privilege access.","token access."],answer:[2],is_multi:false},
{question:"Which AWS service or tool can be used to set up a firewall to control traffic going into and coming out of an Amazon VPC subnet?",options:["Security group","AWS WAF","AWS Firewall Manager","Network ACL"],answer:[3],is_multi:false},
{question:"A company wants to operate a data warehouse to analyze data without managing the data warehouse infrastructure.\nWhich AWS service will meet this requirement?",options:["Amazon Aurora","Amazon Redshift Serverless","AWS Lambda","Amazon RDS"],answer:[1],is_multi:false},
{question:"How does AWS Cloud computing help businesses reduce costs? (Choose two.)",options:["AWS charges the same prices for services in every AWS Region.","AWS enables capacity to be adjusted on demand.","AWS offers discounts for Amazon EC2 instances that remain idle for more than 1 week.","AWS does not charge for data sent from the AWS Cloud to the internet.","AWS eliminates many of the costs of building and maintaining on-premises data centers."],answer:[1,4],is_multi:true},
{question:"A company wants to grant users in one AWS account access to resources in another AWS account. The users do not currently have permission to access the resources.\nWhich AWS service will meet this requirement?",options:["IAM group","IAM role","IAM tag","IAM Access Analyzer"],answer:[1],is_multi:false},
{question:"Which task is the responsibility of AWS when using AWS services?",options:["Management of IAM user permissions","Creation of security group rules for outbound access","Maintenance of physical and environmental controls","Application of Amazon EC2 operating system patches"],answer:[2],is_multi:false},
{question:"A company wants to automate infrastructure deployment by using infrastructure as code (IaC). The company wants to scale production stacks so the stacks can be deployed in multiple AWS Regions.\nWhich AWS service will meet these requirements?",options:["Amazon CloudWatch","AWS Config","AWS Trusted Advisor","AWS CloudFormation"],answer:[3],is_multi:false},
{question:"Which option is an AWS Cloud Adoption Framework (AWS CAF) platform perspective capability?",options:["Data architecture","Data protection","Data governance","Data science"],answer:[0],is_multi:false},
{question:"A company is running a workload in the AWS Cloud.\nWhich AWS best practice ensures the MOST cost-effective architecture for the workload?",options:["Loose coupling","Rightsizing","Caching","Redundancy"],answer:[1],is_multi:false},
{question:"A company is using a third-party service to back up 10 TB of data to a tape library. The on-premises backup server is running out of space. The company wants to use AWS services for the backups without changing its existing backup workflows.\nWhich AWS service should the company use to meet these requirements?",options:["Amazon Elastic Block Store (Amazon EBS)","AWS Storage Gateway","Amazon Elastic Container Service (Amazon ECS)","AWS Lambda"],answer:[1],is_multi:false},
{question:"Which AWS tool gives users the ability to plan their service usage, service costs, and instance reservations, and also allows them to set custom alerts when their costs or usage exceed established thresholds?",options:["Cost Explorer","AWS Budgets","AWS Cost and Usage Report","Reserved Instance reporting"],answer:[1],is_multi:false},
{question:"Which tasks are the customer's responsibility, according to the AWS shared responsibility model? (Choose two.)",options:["Establish the global infrastructure.","Perform client-side data encryption.","Configure IAM credentials.","Secure edge locations.","Patch Amazon RDS DB instances."],answer:[1,2],is_multi:true},
{question:"A developer has been hired by a large company and needs AWS credentials.\nWhich are security best practices that should be followed? (Choose two.)",options:["Grant the developer access to only the AWS resources needed to perform the job.","Share the AWS account root user credentials with the developer.","Add the developer to the administrator's group in AWS IAM.","Configure a password policy that ensures the developer's password cannot be changed.","Ensure the account password policy requires a minimum length."],answer:[0,4],is_multi:true},
{question:"A company has multiple AWS accounts that include compute workloads that cannot be interrupted. The company wants to obtain billing discounts that are based on the company's use of AWS services.\nWhich AWS feature or purchasing option will meet these requirements?",options:["Resource tagging","Consolidated billing","Pay-as-you-go pricing","Spot Instances"],answer:[1],is_multi:false},
{question:"A user wants to allow applications running on an Amazon EC2 instance to make calls to other AWS services. The access granted must be secure.\nWhich AWS service or feature should be used?",options:["Security groups","AWS Firewall Manager","IAM roles","IAM user SSH keys"],answer:[2],is_multi:false},
{question:"A company wants a fully managed Windows file server for its Windows-based applications.\nWhich AWS service will meet this requirement?",options:["Amazon FSx","Amazon Elastic Kubernetes Service (Amazon EKS)","Amazon Elastic Container Service (Amazon ECS)","Amazon EMR"],answer:[0],is_multi:false},
{question:"A company wants to migrate its NFS on-premises workload to AWS.\nWhich AWS Storage Gateway type should the company use to meet this requirement?",options:["Tape Gateway","Volume Gateway","Amazon FSx File Gateway","Amazon S3 File Gateway"],answer:[3],is_multi:false},
{question:"A company needs to track the activity in its AWS accounts, and needs to know when an API call is made against its AWS resources.\nWhich AWS tool or service can be used to meet these requirements?",options:["Amazon CloudWatch","Amazon Inspector","AWS CloudTrail","AWS IAM"],answer:[2],is_multi:false},
{question:"A company has an uninterruptible application that runs on Amazon EC2 instances. The application constantly processes a backlog of files in an Amazon Simple Queue Service (Amazon SQS) queue. This usage is expected to continue to grow for years.\nWhat is the MOST cost-effective EC2 instance purchasing model to meet these requirements?",options:["Spot Instances","On-Demand Instances","Savings Plans","Dedicated Hosts"],answer:[2],is_multi:false},
{question:"A company wants an AWS service to provide product recommendations based on its customer data.\nWhich AWS service will meet this requirement?",options:["Amazon Polly","Amazon Personalize","Amazon Comprehend","Amazon Rekognition"],answer:[1],is_multi:false},
{question:"A company is planning its migration to the AWS Cloud. The company is identifying its capability gaps by using the AWS Cloud Adoption Framework (AWS CAF) perspectives.\nWhich phase of the cloud transformation journey includes these identification activities?",options:["Envision","Align","Scale","Launch"],answer:[1],is_multi:false},
{question:"A social media company wants to protect its web application from common web exploits such as SQL injections and cross-site scripting.\nWhich AWS service will meet these requirements?",options:["Amazon Inspector","AWS WAF","Amazon GuardDuty","Amazon CloudWatch"],answer:[1],is_multi:false},
{question:"Which fully managed AWS service assists with the creation, testing, and management of custom Amazon EC2 images?",options:["EC2 Image Builder","Amazon Machine Image (AMI)","AWS Launch Wizard","AWS Elastic Beanstalk"],answer:[0],is_multi:false},
{question:"A company wants an automated process to continuously scan its Amazon EC2 instances for software vulnerabilities.\nWhich AWS service will meet these requirements?",options:["Amazon GuardDuty","Amazon Inspector","Amazon Detective","Amazon Cognito"],answer:[1],is_multi:false},
{question:"A company needs to perform data processing once a week that typically takes about 5 hours to complete.\nWhich AWS service should the company use for this workload?",options:["AWS Lambda","Amazon EC2","AWS CodeDeploy","AWS Wavelength"],answer:[1],is_multi:false},
{question:"Which AWS service or feature provides log information of the inbound and outbound traffic on network interfaces in a VPC?",options:["Amazon CloudWatch Logs","AWS CloudTrail","VPC Flow Logs","AWS Identity and Access Management (IAM)"],answer:[2],is_multi:false},
{question:"A company wants to design a centralized storage system to manage the configuration data and passwords for its critical business applications.\nWhich AWS service or capability will meet these requirements MOST cost-effectively?",options:["AWS Systems Manager Parameter Store","AWS Secrets Manager","AWS Config","Amazon S3"],answer:[0],is_multi:false},
{question:"A company plans to deploy containers on AWS. The company wants full control of the compute resources that host the containers. Which AWS service will meet these requirements?",options:["Amazon Elastic Kubernetes Service (Amazon EKS)","AWS Fargate","Amazon EC2","Amazon Elastic Container Service (Amazon ECS)"],answer:[2],is_multi:false},
{question:"Which AWS service or feature allows users to create new AWS accounts, group multiple accounts to organize workflows, and apply policies to groups of accounts?",options:["AWS Identity and Access Management (IAM)","AWS Trusted Advisor","AWS CloudFormation","AWS Organizations"],answer:[3],is_multi:false},
{question:"A company wants to store and retrieve files in Amazon S3 for its existing on-premises applications by using industry-standard file system protocols.\nWhich AWS service will meet these requirements?",options:["AWS DataSync","AWS Snowball Edge","Amazon S3 File Gateway","AWS Transfer Family"],answer:[2],is_multi:false},
{question:"A company wants to block SQL injection attacks.\nWhich AWS service or feature should the company use to meet this requirement?",options:["AWS WAF","Network ACLs","Security groups","AWS Certificate Manager (ACM)"],answer:[0],is_multi:false},
{question:"A company wants a unified tool to provide a consistent method to interact with AWS services.\nWhich AWS service or tool will meet this requirement?",options:["AWS CLI","Amazon Elastic Container Service (Amazon ECS)","AWS Cloud9","AWS Virtual Private Network (AWS VPN)"],answer:[0],is_multi:false},
{question:"A company needs to evaluate its AWS environment and provide best practice recommendations in five categories: cost, performance, service limits, fault tolerance and security.\nWhich AWS service can the company use to meet these requirements?",options:["AWS Shield","AWS WAF","AWS Trusted Advisor","AWS Service Catalog"],answer:[2],is_multi:false},
{question:"Which perspective in the AWS Cloud Adoption Framework (AWS CAF) includes capabilities for configuration management and patch management?",options:["Platform","Operations","Security","Governance"],answer:[1],is_multi:false},
{question:"A company has a compute workload that is steady, predictable, and uninterruptible.\nWhich Amazon EC2 instance purchasing options meet these requirements MOST cost-effectively? (Choose two.)",options:["On-Demand Instances","Reserved Instances","Spot Instances","Saving Plans","Dedicated Hosts"],answer:[1,3],is_multi:true},
{question:"Which Amazon EC2 pricing model is the MOST cost efficient for an uninterruptible workload that runs once a year for 24 hours?",options:["On-Demand Instances","Reserved Instances","Spot Instances","Dedicated Instances"],answer:[0],is_multi:false},
{question:"Which option is a shared responsibility between AWS and its customers under the AWS shared responsibility model?",options:["Configuration of Amazon EC2 instance operating systems","Application file system server-side encryption","Patch management","Security of the physical infrastructure"],answer:[2],is_multi:false},
{question:"A company wants to migrate its on-premises workloads to the AWS Cloud. The company wants to separate workloads for chargeback to different departments.\nWhich AWS services or features will meet these requirements? (Choose two.)",options:["Placement groups","Consolidated billing","Edge locations","AWS Config","Multiple AWS accounts"],answer:[1,4],is_multi:true},
{question:"Which task is a responsibility of AWS, according to the AWS shared responsibility model?",options:["Enable client-side encryption for objects that are stored in Amazon S3.","Configure IAM security policies to comply with the principle of least privilege.","Patch the guest operating system on an Amazon EC2 instance.","Apply updates to the Nitro Hypervisor."],answer:[3],is_multi:false},
{question:"Which option is a benefit of using AWS for cloud computing?",options:["Trade variable expense for fixed expense","Pay-as-you-go pricing","Decreased speed and agility","Spending money running and maintaining data centers"],answer:[1],is_multi:false},
{question:"Which option is an AWS Cloud Adoption Framework (AWS CAF) business perspective capability?",options:["Culture evolution","Event management","Data monetization","Platform architecture"],answer:[2],is_multi:false},
{question:"A company is assessing its AWS Business Support plan to determine if the plan still meets the company's needs. The company is considering switching to AWS Enterprise Support.\nWhich additional benefit will the company receive with AWS Enterprise Support?",options:["A full set of AWS Trusted Advisor checks","Phone, email, and chat access to cloud support engineers 24 hours a day, 7 days a week","A designated technical account manager (TAM) to assist in monitoring and optimization","A consultative review and architecture guidance for the company's applications"],answer:[2],is_multi:false},
{question:"Which pricing model will interrupt a running Amazon EC2 instance if capacity becomes temporarily unavailable?",options:["On-Demand Instances","Standard Reserved Instances","Spot Instances","Convertible Reserved Instances"],answer:[2],is_multi:false},
{question:"Which options are AWS Cloud Adoption Framework (AWS CAF) security perspective capabilities? (Choose two.)",options:["Observability","Incident and problem management","Incident response","Infrastructure protection","Availability and continuity"],answer:[2,3],is_multi:true},
{question:"A company wants to run its workload on Amazon EC2 instances for more than 1 year. This workload will run continuously.\nWhich option offers a discounted hourly rate compared to the hourly rate of On-Demand Instances?",options:["AWS Graviton processor","Dedicated Hosts","EC2 Instance Savings Plans","Amazon EC2 Auto Scaling instances"],answer:[2],is_multi:false},
{question:"Which characteristic of the AWS Cloud helps users eliminate underutilized CPU capacity?",options:["Agility","Elasticity","Reliability","Durability"],answer:[1],is_multi:false},
{question:"Which AWS services can a company use to achieve a loosely coupled architecture? (Choose two.)",options:["Amazon WorkSpaces","Amazon Simple Queue Service (Amazon SQS)","Amazon Connect","AWS Trusted Advisor","AWS Step Functions"],answer:[1,4],is_multi:true},
{question:"Which AWS Cloud service can send alerts to customers if custom spending thresholds are exceeded?",options:["AWS Budgets","AWS Cost Explorer","AWS Cost Allocation Tags","AWS Organizations"],answer:[0],is_multi:false},
{question:"A company plans to migrate to the AWS Cloud. The company wants to use the AWS Cloud Adoption Framework (AWS CAF) to define and track business outcomes as part of its cloud transformation journey.\nWhich AWS CAF governance perspective capability will meet these requirements?",options:["Benefits management","Risk management","Application portfolio management","Cloud financial management"],answer:[0],is_multi:false},
{question:"A company needs to quickly and securely move files over long distances between its client and an Amazon S3 bucket.\nWhich S3 feature will meet this requirement?",options:["S3 Versioning","S3 Transfer Acceleration","S3 ACLs","S3 Intelligent-Tiering"],answer:[1],is_multi:false},
{question:"A company needs to continuously run an experimental workload on an Amazon EC2 instance and stop the instance after 12 hours.\nWhich instance purchasing option will meet this requirement MOST cost-effectively?",options:["On-Demand Instances","Reserved Instances","Spot Instances","Dedicated Instances"],answer:[0],is_multi:false},
{question:"Which cloud transformation journey phase of the AWS Cloud Adoption Framework (AWS CAF) focuses on demonstrating how the cloud helps accelerate business outcomes?",options:["Scale","Envision","Align","Launch"],answer:[1],is_multi:false},
{question:"Which option is a customer responsibility under the AWS shared responsibility model?",options:["Maintenance of underlying hardware of Amazon EC2 instances","Application data security","Physical security of data centers","Maintenance of VPC components"],answer:[1],is_multi:false},
{question:"A company wants its Amazon EC2 instances to operate in a highly available environment, even if there is a natural disaster in a particular geographic area.\nWhich approach will achieve this goal?",options:["Use EC2 instances in multiple AWS Regions.","Use EC2 instances in multiple Amazon CloudFront locations.","Use EC2 instances in multiple edge locations.","Use EC2 instances in AWS Local Zones."],answer:[0],is_multi:false},
{question:"A company wants to modernize and convert a monolithic application into microservices. The company wants to move the application to AWS.\nWhich migration strategy should the company use?",options:["Rehost","Replatform","Repurchase","Refactor"],answer:[3],is_multi:false},
{question:"A systems administrator created a new IAM user for a developer and assigned the user an access key instead of a user name and password. What is the access key used for?",options:["To access the AWS account as the AWS account root user","To access the AWS account through the AWS Management Console","To access the AWS account through a CLI","To access all of a company's AWS accounts"],answer:[2],is_multi:false},
{question:"Which option is an environment that consists of one or more data centers?",options:["Amazon CloudFront","Availability Zone","VPC","AWS Outposts"],answer:[1],is_multi:false},
{question:"A company is moving an on-premises data center to the AWS Cloud. The company must migrate 50 petabytes of file storage data to AWS with the least possible operational overhead.\nWhich AWS service or resource should the company use to meet these requirements?",options:["AWS Snowmobile","AWS Snowball Edge","AWS Data Exchange","AWS Database Migration Service (AWS DMS)"],answer:[0],is_multi:false},
{question:"A company has an application with robust hardware requirements. The application must be accessed by students who are using lightweight, low-cost laptops.\nWhich AWS service will help the company deploy the application without investing in backend infrastructure or high-end client hardware?",options:["Amazon AppStream 2.0","AWS AppSync","Amazon WorkLink","AWS Elastic Beanstalk"],answer:[0],is_multi:false},
{question:"A company wants to query its server logs to gain insights about its customers' experiences.\nWhich AWS service will store this data MOST cost-effectively?",options:["Amazon Aurora","Amazon Elastic File System (Amazon EFS)","Amazon Elastic Block Store (Amazon EBS)","Amazon S3"],answer:[3],is_multi:false},
{question:"Which of the following is a recommended design principle for AWS Cloud architecture?",options:["Design tightly coupled components.","Build a single application component that can handle all the application functionality.","Make large changes on fewer iterations to reduce chances of failure.","Avoid monolithic architecture by segmenting workloads."],answer:[3],is_multi:false},
{question:"Which AWS service helps users audit API activity across their AWS account?",options:["AWS CloudTrail","Amazon Inspector","AWS WAF","AWS Config"],answer:[0],is_multi:false},
{question:"Which task is a customer's responsibility, according to the AWS shared responsibility model?",options:["Management of the guest operating systems","Maintenance of the configuration of infrastructure devices","Management of the host operating systems and virtualization","Maintenance of the software that powers Availability Zones"],answer:[0],is_multi:false},
{question:"A company wants to automatically add and remove Amazon EC2 instances. The company wants the EC2 instances to adjust to varying workloads dynamically.\nWhich service or feature will meet these requirements?",options:["Amazon DynamoDB","Amazon EC2 Spot Instances","AWS Snow Family","Amazon EC2 Auto Scaling"],answer:[3],is_multi:false},
{question:"A user wants to securely automate the management and rotation of credentials that are shared between applications, while spending the least amount of time on managing tasks.\nWhich AWS service or feature can be used to accomplish this?",options:["AWS CloudHSM","AWS Key Management Service (AWS KMS)","AWS Secrets Manager","Server-side encryption"],answer:[2],is_multi:false},
{question:"Which security service automatically recognizes and classifies sensitive data or intellectual property on AWS?",options:["Amazon GuardDuty","Amazon Macie","Amazon Inspector","AWS Shield"],answer:[1],is_multi:false},
{question:"Which actions are best practices for an AWS account root user? (Choose two.)",options:["Share root user credentials with team members.","Create multiple root users for the account, separated by environment.","Enable multi-factor authentication (MFA) on the root user.","Create an IAM user with administrator privileges for daily administrative tasks, instead of using the root user.","Use programmatic access instead of the root user and password."],answer:[2,3],is_multi:true},
{question:"A company is running a critical workload on an Amazon RDS DB instance. The company needs the DB instance to be highly available with a recovery time of less than 5 minutes.\nWhich solution will meet these requirements?",options:["Create a read replica of the DB instance.","Create a template of the DB instance by using AWS CloudFormation.","Take frequent snapshots of the DB instance. Store the snapshots in Amazon S3.","Modify the DB instance to be a Multi-AZ deployment."],answer:[3],is_multi:false},
{question:"A company plans to migrate its application to AWS and run the application on Amazon EC2 instances. The application will have continuous usage for 1 year.\nWhich EC2 instance purchasing option will meet these requirements MOST cost-effectively?",options:["Reserved Instances","Spot Instances","On-Demand Instances","Dedicated Hosts"],answer:[0],is_multi:false},
{question:"A company needs to transfer data between an Amazon S3 bucket and an on-premises application.\nWho is responsible for the security of this data, according to the AWS shared responsibility model?",options:["The company","AWS","Firewall vendor","AWS Marketplace partner"],answer:[0],is_multi:false},
{question:"Which pillar of the AWS Well-Architected Framework refers to the ability of a system to recover from infrastructure or service disruptions and dynamically acquire computing resources to meet demand?",options:["Security","Reliability","Performance efficiency","Cost optimization"],answer:[1],is_multi:false},
{question:"A company wants to identify Amazon S3 buckets that are shared with another AWS account.\nWhich AWS service or feature will meet these requirements?",options:["AWS Lake Formation","IAM credential report","Amazon CloudWatch","IAM Access Analyzer"],answer:[3],is_multi:false},
{question:"Which AWS service gives users the ability to build interactive business intelligence dashboards that include machine learning insights?",options:["Amazon Athena","Amazon Kendra","Amazon QuickSight","Amazon Redshift"],answer:[2],is_multi:false},
{question:"Which of the following is an AWS value proposition that describes a user's ability to scale infrastructure based on demand?",options:["Speed of innovation","Resource elasticity","Decoupled architecture","Global deployment"],answer:[1],is_multi:false},
{question:"Which action is a security best practice for access to sensitive data that is stored in an Amazon S3 bucket?",options:["Enable S3 Cross-Region Replication (CRR) on the S3 bucket.","Use IAM roles for applications that require access to the S3 bucket.","Configure AWS WAF to prevent unauthorized access to the S3 bucket.","Configure Amazon GuardDuty to prevent unauthorized access to the S3 bucket."],answer:[1],is_multi:false},
{question:"A company wants to know more about the benefits offered by cloud computing. The company wants to understand the operational advantage of agility. How does AWS provide agility for users?",options:["The ability the ensure high availability by deploying workloads to multiple regions","A pay-as-you-go model for many services and resources","The ability to transfer infrastructure management to the AWS Cloud","The ability to provision and deprovision resources quickly with minimal effort"],answer:[3],is_multi:false},
{question:"A company needs a central user portal so that users can log in to third-party business applications that support Security Assertion Markup Language (SAML) 2.0.\nWhich AWS service will meet this requirement?",options:["AWS Identity and Access Management (IAM)","Amazon Cognito","AWS IAM Identity Center (AWS Single Sign-On)","AWS CLI"],answer:[1],is_multi:false},
{question:"Which AWS service should users use to learn about AWS service availability and operations?",options:["Amazon EventBridge","AWS Service Catalog","AWS Control Tower","AWS Health Dashboard"],answer:[3],is_multi:false},
{question:"Which AWS service or tool can be used to capture information about inbound and outbound traffic in an Amazon VPC?",options:["VPC Flow Logs","Amazon Inspector","VPC endpoint services","NAT gateway"],answer:[0],is_multi:false},
{question:"What is the customer ALWAYS responsible for managing, according to the AWS shared responsibility model?",options:["Software licenses","Networking","Customer data","Encryption keys"],answer:[2],is_multi:false},
{question:"Which AWS service can be used to retrieve compliance reports on demand?",options:["AWS Secrets Manager","AWS Artifact","AWS Security Hub","AWS Certificate Manager"],answer:[1],is_multi:false},
{question:"Which AWS service enables users to check for vulnerabilities on Amazon EC2 instances by using predefined assessment templates?",options:["AWS WAF","AWS Trusted Advisor","Amazon Inspector","AWS Shield"],answer:[2],is_multi:false},
{question:"A company plans to migrate to the AWS Cloud. The company is gathering information about its on-premises infrastructure and requires information such as the hostname, IP address, and MAC address.\nWhich AWS service will meet these requirements?",options:["AWS DataSync","AWS Application Migration Service","AWS Application Discovery Service","AWS Database Migration Service (AWS DMS)"],answer:[2],is_multi:false},
{question:"Which action will help increase security in the AWS Cloud?",options:["Enable programmatic access for all IAM users.","Use IAM users instead of IAM roles to delegate permissions.","Rotate access keys on a reoccurring basis.","Use inline policies instead of customer managed policies."],answer:[2],is_multi:false},
{question:"A company is planning to migrate its application to the AWS Cloud.\nWhich AWS tool or set of resources should the company use to analyze and assess its readiness for migration?",options:["AWS Cloud Adoption Framework (AWS CAF)","AWS Pricing Calculator","AWS Well-Architected Framework","AWS Budgets"],answer:[0],is_multi:false},
{question:"Which of the following describes some of the core functionality of Amazon S3?",options:["Amazon S3 is a high-performance block storage service that is designed for use with Amazon EC2.","Amazon S3 is an object storage service that provides high-level performance, security, scalability, and data availability.","Amazon S3 is a fully managed, highly reliable, and scalable file storage system that is accessible over the industry-standard SMB protocol.","Amazon S3 is a scalable, fully managed elastic NFS for use with AWS Cloud services and on-premises resources."],answer:[1],is_multi:false},
{question:"Which AWS benefit is demonstrated by on-demand technology services that enable companies to replace upfront fixed expenses with variable expenses?",options:["High availability","Economies of scale","Pay-as-you-go pricing","Global reach"],answer:[2],is_multi:false},
{question:"Which AWS services or features enable users to connect on-premises networks to a VPC? (Choose two.)",options:["AWS VPN","Elastic Load Balancing","AWS Direct Connect","VPC peering","Amazon CloudFront"],answer:[0,2],is_multi:true},
{question:"A user needs to quickly deploy a nonrelational database on AWS. The user does not want to manage the underlying hardware or the database software.\nWhich AWS service can be used to accomplish this?",options:["Amazon RDS","Amazon DynamoDB","Amazon Aurora","Amazon Redshift"],answer:[1],is_multi:false},
{question:"Which actions are examples of a company's effort to rightsize its AWS resources to control cloud costs? (Choose two.)",options:["Switch from Amazon RDS to Amazon DynamoDB to accommodate NoSQL datasets.","Base the selection of Amazon EC2 instance types on past utilization patterns.","Use Amazon S3 Lifecycle policies to move objects that users access infrequently to lower-cost storage tiers.","Use Multi-AZ deployments for Amazon RDS.","Replace existing Amazon EC2 instances with AWS Elastic Beanstalk."],answer:[1,2],is_multi:true},
{question:"Which AWS service or feature can a company use to apply security rules to specific Amazon EC2 instances?",options:["Network ACLs","Security groups","AWS Trusted Advisor","AWS WAF"],answer:[1],is_multi:false},
{question:"Which design principles support the reliability pillar of the AWS Well-Architected Framework? (Choose two.)",options:["Perform operations as code.","Enable traceability.","Automatically scale to meet demand.","Deploy resources globally to improve response time.","Automatically recover from failure."],answer:[2,4],is_multi:true},
{question:"A company that uses AWS needs to transfer 2 TB of data.\nWhich type of transfer of that data would result in no cost for the company?",options:["Inbound data transfer from the internet","Outbound data transfer to the internet","Data transfer between AWS Regions","Data transfer between Availability Zones"],answer:[0],is_multi:false},
{question:"A company wants to create templates that the company can reuse to deploy multiple AWS resources.\nWhich AWS service or feature can the company use to meet this requirement?",options:["AWS Marketplace","Amazon Machine Image (AMI)","AWS CloudFormation","AWS OpsWorks"],answer:[2],is_multi:false},
{question:"A company is building an application that requires the ability to send, store, and receive messages between application components. The company has another requirement to process messages in first-in, first-out (FIFO) order.\nWhich AWS service should the company use?",options:["AWS Step Functions","Amazon Simple Notification Service (Amazon SNS)","Amazon Kinesis Data Streams","Amazon Simple Queue Service (Amazon SQS)"],answer:[3],is_multi:false},
{question:"Which AWS service or feature is a browser-based, pre-authenticated service that can be launched directly from the AWS Management Console?",options:["AWS API","AWS Lightsail","AWS Cloud9","AWS CloudShell"],answer:[3],is_multi:false},
{question:"A company wants to migrate its database to a managed AWS service that is compatible with PostgreSQL.\nWhich AWS services will meet these requirements? (Choose two.)",options:["Amazon Athena","Amazon RDS","Amazon EC2","Amazon DynamoDB","Amazon Aurora"],answer:[1,4],is_multi:true},
{question:"A company has a fleet of cargo ships. The cargo ships have sensors that collect data at sea, where there is intermittent or no internet connectivity. The company needs to collect, format, and process the data at sea and move the data to AWS later.\nWhich AWS service should the company use to meet these requirements?",options:["AWS IoT Core","Amazon Lightsail","AWS Storage Gateway","AWS Snowball Edge"],answer:[3],is_multi:false},
{question:"A company hosts an application on multiple Amazon EC2 instances. The application uses Amazon Simple Notification Service (Amazon SNS) to send messages.\nWhich AWS service or feature will give the application permission to access required AWS services?",options:["AWS Certificate Manager (ACM)","IAM roles","AWS Security Hub","Amazon GuardDuty"],answer:[1],is_multi:false},
{question:"A user has limited knowledge of AWS services, but wants to quickly deploy a scalable Node.js application in the AWS Cloud.\nWhich service should be used to deploy the application?",options:["AWS CloudFormation","AWS Elastic Beanstalk","Amazon EC2","AWS OpsWorks"],answer:[1],is_multi:false},
{question:"A company needs a content delivery network that provides secure delivery of data, videos, applications, and APIs to users globally with low latency and high transfer speeds.\nWhich AWS service meets these requirements?",options:["Amazon CloudFront","Elastic Load Balancing","Amazon S3","Amazon Elastic Transcoder"],answer:[0],is_multi:false},
{question:"A company needs to use third-party software for its workload on AWS.\nWhich AWS service or feature can the company use to purchase the software?",options:["AWS Resource Access Manager","AWS Managed Services","AWS License Manager","AWS Marketplace"],answer:[3],is_multi:false},
{question:"A company needs fully managed, highly reliable, and scalable file storage that is accessible over the Server Message Block (SMB) protocol.\nWhich AWS service will meet these requirements?",options:["Amazon S3","Amazon Elastic File System (Amazon EFS)","Amazon FSx for Windows File Server","Amazon Elastic Block Store (Amazon EBS)"],answer:[2],is_multi:false},
{question:"A company needs to centrally configure and manage Amazon VPC security groups across multiple AWS accounts within an organization in AWS Organizations.\nWhich AWS service should the company use to meet these requirements?",options:["AWS Firewall Manager","Amazon GuardDuty","Amazon Detective","AWS WAF"],answer:[0],is_multi:false},
{question:"Which task is a responsibility of AWS, according to the AWS shared responsibility model?",options:["Configure identity and access management for applications.","Manage encryption options for data that is stored on AWS.","Configure security groups for Amazon EC2 instances.","Maintain the physical hardware of the infrastructure."],answer:[3],is_multi:false},
{question:"A company has an Amazon EC2 instance in a private subnet. The company wants to initiate a connection to the internet to pull operating system updates while preventing traffic from the internet from accessing the EC2 instance.\nWhich AWS managed service allows this?",options:["VPC endpoint","NAT gateway","Amazon PrivateLink","VPC peering"],answer:[1],is_multi:false},
{question:"Which actions are the responsibility of AWS, according to the AWS shared responsibility model? (Choose two.)",options:["Securing the virtualization layer","Patching the operating system on Amazon EC2 instances","Enforcing a strict password policy for IAM users","Patching the operating system on Amazon RDS instances","Configuring security groups and network ACLs"],answer:[0,3],is_multi:true},
{question:"A company is storing data that will not be frequently accessed in the AWS Cloud. If the company needs to access the data, the data needs to be retrieved within 12 hours. The company wants a solution that is cost-effective for storage costs for each gigabyte.\nWhich Amazon S3 storage class will meet these requirements?",options:["S3 Standard","S3 Glacier Flexible Retrieval","S3 One Zone-Infrequent Access (S3 One Zone-IA)","S3 Standard-Infrequent Access (S3 Standard-IA)"],answer:[2],is_multi:false},
{question:"Which AWS service or resource can be used to identify services that have been used by a user within a specified date range?",options:["Amazon S3 access control lists (ACLs)","AWS Certificate Manager (ACM)","Network Access Analyzer","AWS Identity and Access Management Access Analyzer"],answer:[3],is_multi:false},
{question:"A company needs to engage third-party consultants to help maintain and support its AWS environment and the company's business needs.\nWhich AWS service or resource will meet these requirements?",options:["AWS Support","AWS Organizations","AWS Service Catalog","AWS Partner Network (APN)"],answer:[3],is_multi:false},
{question:"A company wants to create Amazon QuickSight dashboards every week by using its billing data.\nWhich AWS feature or tool can the company use to meet these requirements?",options:["AWS Budgets","AWS Cost Explorer","AWS Cost and Usage Report","AWS Cost Anomaly Detection"],answer:[2],is_multi:false},
{question:"A company is planning to move data backups to the AWS Cloud. The company needs to replace on-premises storage with storage that is cloud-based but locally cached.\nWhich AWS service meets these requirements?",options:["AWS Storage Gateway","AWS Snowcone","AWS Backup","Amazon Elastic File System (Amazon EFS)"],answer:[0],is_multi:false},
{question:"A company needs to organize its resources and track AWS costs on a detailed level. The company needs to categorize costs by business department, environment, and application.\nWhich solution will meet these requirements?",options:["Access the AWS Cost Management console to organize resources, set an AWS budget, and receive notifications of unintentional usage.","Use tags to organize the resources. Activate cost allocation tags to track AWS costs on a detailed level.","Create Amazon CloudWatch dashboards to visually organize and track costs individually.","Access the AWS Billing and Cost Management dashboard to organize and track resource consumption on a detailed level."],answer:[1],is_multi:false},
{question:"A company needs to plan, schedule, and run hundreds of thousands of computing jobs on AWS.\nWhich AWS service can the company use to meet this requirement?",options:["AWS Step Functions","AWS Service Catalog","Amazon Simple Queue Service (Amazon SQS)","AWS Batch"],answer:[3],is_multi:false},
{question:"Which AWS services or features provide high availability and low latency by enabling failover across different AWS Regions? (Choose two.)",options:["Amazon Route 53","Network Load Balancer","Amazon S3 Transfer Acceleration","AWS Global Accelerator","Application Load Balancer"],answer:[0,3],is_multi:true},
{question:"Which of the following is a way to use Amazon EC2 Auto Scaling groups to scale capacity in the AWS Cloud?",options:["Scale the number of EC2 instances in or out automatically, based on demand.","Use serverless EC2 instances.","Scale the size of EC2 instances up or down automatically, based on demand.","Transfer unused CPU resources between EC2 instances."],answer:[0],is_multi:false},
{question:"Which abilities are benefits of the AWS Cloud? (Choose two.)",options:["Trade variable expenses for capital expenses.","Deploy globally in minutes.","Plan capacity in advance of deployments.","Take advantage of economies of scale.","Reduce dependencies on network connectivity."],answer:[1,3],is_multi:true},
{question:"Which AWS security service protects applications from distributed denial of service attacks with always-on detection and automatic inline mitigations?",options:["Amazon Inspector","AWS Web Application Firewall (AWS WAF)","Elastic Load Balancing (ELB)","AWS Shield"],answer:[3],is_multi:false},
{question:"Which AWS service allows users to model and provision AWS resources using common programming languages?",options:["AWS CloudFormation","AWS CodePipeline","AWS Cloud Development Kit (AWS CDK)","AWS Systems Manager"],answer:[2],is_multi:false},
{question:"Which Amazon EC2 instance pricing model can provide discounts of up to 90%?",options:["Reserved Instances","On-Demand","Dedicated Hosts","Spot Instances"],answer:[3],is_multi:false},
{question:"Which of the following acts as an instance-level firewall to control inbound and outbound access?",options:["Network access control list","Security groups","AWS Trusted Advisor","Virtual private gateways"],answer:[1],is_multi:false},
{question:"A company must be able to develop, test, and launch an application in the AWS Cloud quickly.\nWhich advantage of cloud computing will meet these requirements?",options:["Stop guessing capacity","Trade fixed expense for variable expense","Achieve economies of scale","Increase speed and agility"],answer:[3],is_multi:false},
{question:"A company has teams that have different job roles and responsibilities. The company's employees often change teams. The company needs to manage permissions for the employees so that the permissions are appropriate for the job responsibilities.\nWhich IAM resource should the company use to meet this requirement with the LEAST operational overhead?",options:["IAM user groups","IAM roles","IAM instance profiles","IAM policies for individual users"],answer:[1],is_multi:false},
{question:"Which AWS service can a company use to securely store and encrypt passwords for a database?",options:["AWS Shield","AWS Secrets Manager","AWS Identity and Access Management (IAM)","Amazon Cognito"],answer:[1],is_multi:false},
{question:"What can a cloud practitioner use to retrieve AWS security and compliance documents and submit them as evidence to an auditor or regulator?",options:["AWS Certificate Manager","AWS Systems Manager","AWS Artifact","Amazon Inspector"],answer:[2],is_multi:false},
{question:"Which encryption types can be used to protect objects at rest in Amazon S3? (Choose two.)",options:["Server-side encryption with Amazon S3 managed encryption keys (SSE-S3)","Server-side encryption with AWS KMS managed keys (SSE-KMS)","TLS","SSL","Transparent Data Encryption (TDE)"],answer:[0,1],is_multi:true},
{question:"A company wants to integrate its online shopping website with social media login credentials.\nWhich AWS service can the company use to make this integration?",options:["AWS Directory Service","AWS Identity and Access Management (IAM)","Amazon Cognito","AWS IAM Identity Center (AWS Single Sign-On)"],answer:[2],is_multi:false},
{question:"Which AWS service is used to track, record, and audit configuration changes made to AWS resources?",options:["AWS Shield","AWS Config","AWS IAM","Amazon Inspector"],answer:[1],is_multi:false},
{question:"A customer runs an On-Demand Amazon Linux EC2 instance for 3 hours, 5 minutes, and 6 seconds.\nFor how much time will the customer be billed?",options:["3 hours, 5 minutes","3 hours, 5 minutes, and 6 seconds","3 hours, 6 minutes","4 hours"],answer:[1],is_multi:false},
{question:"A company website is experiencing DDoS attacks.\nWhich AWS service can help protect the company website against these attacks?",options:["AWS Resource Access Manager","AWS Amplify","AWS Shield","Amazon GuardDuty"],answer:[2],is_multi:false},
{question:"A company wants a customized assessment of its current on-premises environment. The company wants to understand its projected running costs in the AWS Cloud.\nWhich AWS service or tool will meet these requirements?",options:["AWS Trusted Advisor","Amazon Inspector","AWS Control Tower","Migration Evaluator"],answer:[3],is_multi:false},
{question:"A company that has multiple business units wants to centrally manage and govern its AWS Cloud environments. The company wants to automate the creation of AWS accounts, apply service control policies (SCPs), and simplify billing processes.\nWhich AWS service or tool should the company use to meet these requirements?",options:["AWS Organizations","Cost Explorer","AWS Budgets","AWS Trusted Advisor"],answer:[0],is_multi:false},
{question:"A company is hosting an application in the AWS Cloud. The company wants to verify that underlying AWS services and general AWS infrastructure are operating normally.\nWhich combination of AWS services can the company use to gather the required information? (Choose two.)",options:["AWS Personal Health Dashboard","AWS Systems Manager","AWS Trusted Advisor","AWS Service Health Dashboard","AWS Service Catalog"],answer:[0,3],is_multi:true},
{question:"A company needs to migrate a PostgreSQL database from on-premises to Amazon RDS.\nWhich AWS service or tool should the company use to meet this requirement?",options:["Cloud Adoption Readiness Tool","AWS Migration Hub","AWS Database Migration Service (AWS DMS)","AWS Application Migration Service"],answer:[3],is_multi:false},
{question:"Which cloud concept is demonstrated by using AWS Compute Optimizer?",options:["Security validation","Rightsizing","Elasticity","Global reach"],answer:[1],is_multi:false},
{question:"A company hosts a large amount of data in AWS. The company wants to identify if any of the data should be considered sensitive.\nWhich AWS service will meet the requirement?",options:["Amazon Inspector","Amazon Macie","AWS Identity and Access Management (IAM)","Amazon CloudWatch"],answer:[1],is_multi:false},
{question:"A user has a stateful workload that will run on Amazon EC2 for the next 3 years.\nWhat is the MOST cost-effective pricing model for this workload?",options:["On-Demand Instances","Reserved Instances","Dedicated Instances","Spot Instances"],answer:[1],is_multi:false},
{question:"Who enables encryption of data at rest for Amazon Elastic Block Store (Amazon EBS)?",options:["AWS Support","AWS customers","AWS Key Management Service (AWS KMS)","AWS Trusted Advisor"],answer:[1],is_multi:false},
{question:"What can a user accomplish using AWS CloudTrail?",options:["Generate an IAM user credentials report.","Record API calls made to AWS services.","Assess the compliance of AWS resource configurations with policies and guidelines.","Ensure that Amazon EC2 instances are patched with the latest security updates."],answer:[1],is_multi:false},
{question:"A company is planning to host its workloads on AWS.\nWhich AWS service requires the company to update and patch the guest operating system?",options:["Amazon DynamoDB","Amazon S3","Amazon EC2","Amazon Aurora"],answer:[2],is_multi:false},
{question:"Which AWS service or feature will search for and identify AWS resources that are shared externally?",options:["Amazon OpenSearch Service","AWS Control Tower","AWS IAM Access Analyzer","AWS Fargate"],answer:[2],is_multi:false},
{question:"A company is migrating its workloads to the AWS Cloud. The company must retain full control of patch management for the guest operating systems that host its applications.\nWhich AWS service should the company use to meet these requirements?",options:["Amazon DynamoDB","Amazon EC2","AWS Lambda","Amazon RDS"],answer:[1],is_multi:false},
{question:"At what support level do users receive access to a support concierge?",options:["Basic Support","Developer Support","Business Support","Enterprise Support"],answer:[3],is_multi:false},
{question:"Which AWS service can a company use to visually design and build serverless applications?",options:["AWS Lambda","AWS Batch","AWS Application Composer","AWS App Runner"],answer:[2],is_multi:false},
{question:"A company wants to migrate to AWS and use the same security software it uses on premises. The security software vendor offers its security software as a service on AWS.\nWhere can the company purchase the security solution?",options:["AWS Partner Solutions Finder","AWS Support Center","AWS Management Console","AWS Marketplace"],answer:[3],is_multi:false},
{question:"A company has deployed an Amazon EC2 instance.\nWhich option is an AWS responsibility under the AWS shared responsibility model?",options:["Managing and encrypting application data","Installing updates and security patches of guest operating system","Configuration of infrastructure devices","Configuration of security groups on each instance"],answer:[2],is_multi:false},
{question:"A company wants to migrate its PostgreSQL database to AWS. The company does not use the database frequently.\nWhich AWS service or resource will meet these requirements with the LEAST management overhead?",options:["PostgreSQL on Amazon EC2","Amazon RDS for PostgreSQL","Amazon Aurora PostgreSQL-Compatible Edition","Amazon Aurora Serverless"],answer:[3],is_multi:false},
{question:"A company is using Amazon DynamoDB for its application database.\nWhich tasks are the responsibility of AWS, according to the AWS shared responsibility model? (Choose two.)",options:["Classify data.","Configure access permissions.","Manage encryption options.","Provide public endpoints to store and retrieve data.","Manage the infrastructure layer and the operating system."],answer:[3,4],is_multi:true},
{question:"A company wants to create a globally accessible ecommerce platform for its customers. The company wants to use a highly available and scalable DNS web service to connect users to the platform.\nWhich AWS service will meet these requirements?",options:["Amazon EC2","Amazon VPC","Amazon Route 53","Amazon RDS"],answer:[2],is_multi:false},
{question:"Which maintenance task is the customer's responsibility, according to the AWS shared responsibility model?",options:["Physical connectivity among Availability Zones","Network switch maintenance","Hardware updates and firmware patches","Amazon EC2 updates and security patches"],answer:[3],is_multi:false},
{question:"A company wants to improve its security posture by reviewing user activity through API calls.\nWhich AWS service will meet this requirement?",options:["AWS WAF","Amazon Detective","Amazon CloudWatch","AWS CloudTrail"],answer:[3],is_multi:false},
{question:"A company is migrating to the AWS Cloud and plans to run experimental workloads for 3 to 6 months on AWS.\nWhich pricing model will meet these requirements?",options:["Use Savings Plans for a 3-year term.","Use Dedicated Hosts.","Buy Reserved Instances.","Use On-Demand Instances."],answer:[3],is_multi:false},
{question:"A company that has AWS Enterprise Support is launching a new version of a popular product in 2 months. The company expects a large increase in traffic to its website. The website is hosted on Amazon EC2 instances.\nWhich action should the company take to assess its readiness to scale for this launch?",options:["Replace the EC2 instances with AWS Lambda functions.","Use AWS Infrastructure Event Management (IEM) support.","Submit a request on AWS Marketplace to monitor the event.","Review the coverage reports in the AWS Cost Management console."],answer:[1],is_multi:false},
{question:"A company wants to launch multiple workloads on AWS. Each workload is related to a different business unit. The company wants to separate and track costs for each business unit.\nWhich solution will meet these requirements with the LEAST operational overhead?",options:["Use AWS Organizations and create one account for each business unit.","Use a spreadsheet to control the owners and cost of each resource.","Use an Amazon DynamoDB table to record costs for each business unit.","Use the AWS Billing console to assign owners to resources and track costs."],answer:[0],is_multi:false},
{question:"A company wants a time-series database service that makes it easier to store and analyze trillions of events each day.\nWhich AWS service will meet this requirement?",options:["Amazon Neptune","Amazon Timestream","Amazon Forecast","Amazon DocumentDB (with MongoDB compatibility)"],answer:[1],is_multi:false},
{question:"Which option is a shared control between AWS and the customer, according to the AWS shared responsibility model?",options:["Configuration management","Physical and environmental controls","Data integrity authentication","Identity and access management"],answer:[3],is_multi:false},
{question:"A company often does not use all of its current Amazon EC2 capacity to run stateless workloads. The company wants to optimize its EC2 costs.\nWhich EC2 instance type will meet these requirements?",options:["Spot Instances","Dedicated Instances","Reserved Instances","On-Demand Instances"],answer:[0],is_multi:false},
{question:"A company wants to store data in Amazon S3. The company rarely access the data, and the data can be regenerated if necessary. The company wants to store the data in the most cost-effective storage class.\nWhich S3 storage class will meet this requirement?",options:["S3 Standard","S3 Intelligent-Tiering","S3 Standard-Infrequent Access (S3 Standard-IA)","S3 One Zone-Infrequent Access (S3 One Zone-IA)"],answer:[3],is_multi:false},
{question:"A company has migrated its workloads to AWS. The company wants to adopt AWS at scale and operate more efficiently and securely. Which AWS service or framework should the company use for operational support?",options:["AWS Support","AWS Cloud Adoption Framework (AWS CAF)","AWS Managed Services (AMS)","AWS Well-Architected Framework"],answer:[3],is_multi:false},
{question:"A company wants to provision and manage its AWS infrastructure by using the common programming languages Typescript, Python, Java, and .NET.\nWhich AWS service will meet this requirement?",options:["AWS CodeBuild","AWS CloudFormation","AWS CLI","AWS Cloud Development Kit (AWS CDK)"],answer:[3],is_multi:false},
{question:"Which Amazon EC2 pricing model provides the MOST cost savings for an always-up, right-sized database server running for a project that will last 1 year?",options:["On-Demand Instances","Convertible Reserved Instances","Spot Instances","Standard Reserved Instances"],answer:[3],is_multi:false},
{question:"A company has a physical tape library to store data backups. The tape library is running out of space. The company needs to extend the tape library's capacity to the AWS Cloud.\nWhich AWS service should the company use to meet this requirement?",options:["Amazon Elastic File System (Amazon EFS)","Amazon Elastic Block Store (Amazon EBS)","Amazon S3","AWS Storage Gateway"],answer:[3],is_multi:false},
{question:"A company is using the AWS Free Tier for several AWS services for an application.\nWhat will happen if the Free Tier usage period expires or if the application use exceeds the Free Tier usage limits?",options:["The company will be charged the standard pay-as-you-go service rates for the usage that exceeds the Free Tier usage.","AWS Support will contact the company to set up standard service charges.","The company will be charged for the services it consumed during the Free Tier period, plus additional charges for service consumption after the Free Tier period.","The company's AWS account will be frozen and can be restarted after a payment plan is established."],answer:[0],is_multi:false},
{question:"A company wants to monitor its workload performance. The company wants to ensure that the cloud services are delivered at a level that meets its business needs.\nWhich AWS Cloud Adoption Framework (AWS CAF) perspective will meet these requirements?",options:["Business","Governance","Platform","Operations"],answer:[3],is_multi:false},
{question:"A company wants to migrate its applications to the AWS Cloud. The company plans to identify and prioritize any business transformation opportunities and evaluate its AWS Cloud readiness.\nWhich AWS service or tool should the company use to meet these requirements?",options:["AWS Cloud Adoption Framework (AWS CAF)","AWS Managed Services (AMS)","AWS Well-Architected Framework","AWS Migration Hub"],answer:[0],is_multi:false},
{question:"A company need an AWS service that provides a clear baseline of what the company runs in its on-premises data centers. The company needs the projected cost to run its on-premises workloads in the AWS Cloud.\nWhat AWS service or tool will meet these requirements?",options:["AWS Compute Optimizer","AWS Cost Explorer","AWS Systems Manager Agent (SSM Agent)","Migration Evaluator"],answer:[1],is_multi:false},
{question:"A company acquired another corporation. The company now has two AWS accounts.\nWhich AWS service or tool can the company use to consolidate the billing for these two accounts?",options:["AWS Systems Manager","AWS Organizations","AWS License Manager","Cost Explorer"],answer:[1],is_multi:false},
{question:"A company wants to set up its workloads to perform their intended functions and recover quickly from failure.\nWhich pillar of the AWS Well-Architected Framework aligns with these goals?",options:["Performance efficiency","Sustainability","Reliability","Security"],answer:[2],is_multi:false},
{question:"Which of the following is a managed AWS service that is used specifically for extract, transform, and load (ETL) data?",options:["Amazon Athena","AWS Glue","Amazon S3","AWS Snowball Edge"],answer:[1],is_multi:false},
{question:"A company wants to migrate petabytes of data from its on-premises data center to AWS. The company does not want to use an internet connection to perform the migration.\nWhich AWS service will meet these requirements?",options:["AWS DataSync","Amazon Connect","AWS Snowmobile","AWS Direct Connect"],answer:[2],is_multi:false},
{question:"A company wants to receive alerts to monitor its overall operating costs for its AWS public cloud infrastructure.\nWhich AWS offering will meet these requirements?",options:["Amazon EventBridge","Compute Savings Plans","AWS Budgets","Migration Evaluator"],answer:[2],is_multi:false},
{question:"How does the AWS Enterprise Support Concierge team help users?",options:["Supporting application development","Providing architecture guidance","Answering billing and account inquiries","Answering questions regarding technical support cases"],answer:[2],is_multi:false},
{question:"A company wants to run a simulation for 3 years without interruptions.\nWhich Amazon EC2 instance purchasing option will meet these requirements MOST cost-effectively?",options:["Spot Instances","Reserved Instances","Dedicated Hosts","On-Demand Instances"],answer:[1],is_multi:false},
{question:"Which AWS service or resource can provide discounts on some AWS service costs in exchange for a spending commitment?",options:["Amazon Detective","AWS Pricing Calculator","Savings Plans","Basic Support"],answer:[2],is_multi:false},
{question:"Which of the following are pillars of the AWS Well-Architected Framework? (Choose two.)",options:["High availability","Performance efficiency","Cost optimization","Going global in minutes","Continuous development"],answer:[1,2],is_multi:true},
{question:"A company wants to use Amazon EC2 instances to provide a static website to users all over the world. The company needs to minimize latency for the users.\nWhich solution meets these requirements?",options:["Use EC2 instances in multiple edge locations.","Use EC2 instances in the same Availability Zone but in different AWS Regions.","Use Amazon CloudFront with the EC2 instances configured as the source.","Use EC2 instances in the same Availability Zone but in different AWS accounts."],answer:[2],is_multi:false},
{question:"A team of researchers is going to collect data at remote locations around the world. Many locations do not have internet connectivity. The team needs to capture the data in the field, and transfer it to the AWS Cloud later.\nWhich AWS service will support these requirements?",options:["AWS Outposts","AWS Transfer Family","AWS Snow Family","AWS Migration Hub"],answer:[2],is_multi:false},
{question:"Which of the following are benefits that a company receives when it moves an on-premises production workload to AWS? (Choose two.)",options:["AWS trains the company's staff on the use of all the AWS services.","AWS manages all security in the cloud.","AWS offers free support from technical account managers (TAMs).","AWS offers high availability.","AWS provides economies of scale."],answer:[3,4],is_multi:true},
{question:"A company has decided to adopt Amazon EC2 infrastructure and wants to scale various stateless services for short-term usage.\nWhich EC2 pricing model is MOST cost-efficient to meet these requirements?",options:["Spot Instances","On-Demand Instances","Reserved Instances","Dedicated Hosts"],answer:[0],is_multi:false},
{question:"Which of the following are benefits of AWS Trusted Advisor? (Choose two.)",options:["Access to Amazon Simple Queue Service (Amazon SQS)","Cost optimization recommendations","Hourly refresh of the service limit checks","Security checks","AWS Identity and Access Management (IAM) approval management"],answer:[1,3],is_multi:true},
{question:"A company wants to save costs by archiving data that is no longer frequently accessed by end users.\nWhich Amazon S3 feature will meet this requirement?",options:["S3 Versioning","S3 Lifecycle","S3 Object Lock","S3 Inventory"],answer:[1],is_multi:false},
{question:"Which cloud computing advantage is a company applying when it uses AWS Regions to increase application availability to users in different countries?",options:["Pay-as-you-go pricing","Capacity forecasting","Economies of scale","Global reach"],answer:[3],is_multi:false},
{question:"A company wants an AWS service to collect and process 10 TB of data locally and transfer the data to AWS. The company has intermittent connectivity.\nWhich AWS service will meet these requirements?",options:["AWS Database Migration Service (AWS DMS)","AWS DataSync","AWS Backup","AWS Snowball Edge"],answer:[3],is_multi:false},
{question:"Which of the following is an AWS Well-Architected Framework design principle for operational excellence in the AWS Cloud?",options:["Go global in minutes.","Make frequent, small, reversible changes.","Implement a strong foundation of identity and access management","Stop spending money on hardware infrastructure for data center operations."],answer:[1],is_multi:false},
{question:"What is a benefit of using AWS serverless computing?",options:["Application deployment and management are not required.","Application security will be fully managed by AWS.","Monitoring and logging are not needed.","Management of infrastructure is offloaded to AWS."],answer:[3],is_multi:false},
{question:"A developer wants AWS users to access AWS services by using temporary security credentials.\nWhich AWS service or feature should the developer use to provide these credentials?",options:["IAM policies","IAM user groups","AWS Security Token Service (AWS STS)","AWS IAM Identity Center (AWS Single Sign-On)"],answer:[2],is_multi:false},
{question:"A global company wants to use a managed security service for protection from SQL injection attacks. The service also must provide detailed logging information about access to the company's ecommerce applications.\nWhich AWS service will meet these requirements?",options:["AWS Network Firewall","Amazon RDS for SQL Server","Amazon GuardDuty","AWS WAF"],answer:[3],is_multi:false},
{question:"A company is migrating its on-premises server to an Amazon EC2 instance. The server must stay active at all times for the next 12 months.\nWhich EC2 pricing option is the MOST cost-effective for the company's workload?",options:["On-Demand","Dedicated Hosts","Spot Instances","Reserved Instances"],answer:[3],is_multi:false},
{question:"Which of the following is the customer's responsibility under the AWS shared responsibility model? (Choose two.)",options:["Maintain the configuration of infrastructure devices.","Maintain patching and updates within the hardware infrastructure.","Maintain the configuration of guest operating systems and applications.","Manage decisions involving encryption options.","Maintain infrastructure hardware."],answer:[2,3],is_multi:true},
{question:"A company wants to verify if multi-factor authentication (MFA) is enabled for all users within its AWS accounts.\nWhich AWS service or resource will meet this requirement?",options:["AWS Cost and Usage Report","IAM credential reports","AWS Artifact","Amazon CloudFront reports"],answer:[1],is_multi:false},
{question:"A company uses AWS security services and tools. The company needs a service to help manage the security alerts and must organize the alerts into a single dashboard.\nWhich AWS service should the company use to meet these requirements?",options:["Amazon GuardDuty","Amazon Inspector","Amazon Macie","AWS Security Hub"],answer:[3],is_multi:false},
{question:"A company wants to run its workloads in the AWS Cloud effectively, reduce management overhead, and improve processes.\nWhich AWS Well-Architected Framework pillar represents these requirements?",options:["Reliability","Operational excellence","Performance efficiency","Cost optimization"],answer:[1],is_multi:false},
{question:"A company uses Amazon S3 to store records that can contain personally identifiable information (PII). The company wants a solution that can monitor all S3 buckets for PII and immediately alert staff about vulnerabilities.\nWhich AWS service will meet these requirements?",options:["Amazon GuardDuty","Amazon Detective","Amazon Macie","AWS Shield"],answer:[2],is_multi:false},
{question:"Which AWS service allows users to download security and compliance reports about the AWS infrastructure on demand?",options:["Amazon GuardDuty","AWS Security Hub","AWS Artifact","AWS Shield"],answer:[2],is_multi:false},
{question:"An external auditor has requested that a company provide a list of all its IAM users, including the status of users' credentials and access keys.\nWhat is the SIMPLEST way to provide this information?",options:["Create an IAM user account for the auditor, granting the auditor administrator permissions.","Take a screenshot of each user's page in the AWS Management Console, then provide the screenshots to the auditor.","Download the IAM credential report, then provide the report to the auditor.","Download the AWS Trusted Advisor report, then provide the report to the auditor."],answer:[2],is_multi:false},
{question:"Which task can a company perform by using security groups in the AWS Cloud?",options:["Allow access to an Amazon EC2 instance through only a specific port.","Deny access to malicious IP addresses at a subnet level.","Protect data that is cached by Amazon CloudFront.","Apply a stateless firewall to an Amazon EC2 instance."],answer:[0],is_multi:false},
{question:"A company plans to run a compute-intensive workload that uses graphics processing units (GPUs).\nWhich Amazon EC2 instance type should the company use?",options:["Accelerated computing","Compute optimized","Storage optimized","General purpose"],answer:[0],is_multi:false},
{question:"Which of the following are features of network ACLs as they are used in the AWS Cloud? (Choose two.)",options:["They are stateless.","They are stateful.","They evaluate all rules before allowing traffic.","They process rules in order, starting with the lowest numbered rule, when deciding whether to allow traffic.","They operate at the instance level."],answer:[0,3],is_multi:true},
{question:"Which capabilities are in the platform perspective of the AWS Cloud Adoption Framework (AWS CAF)? (Choose two.)",options:["Performance and capacity management","Data engineering","Continuous integration and continuous delivery (CI/CD)","Infrastructure protection","Change and release management"],answer:[1,2],is_multi:true},
{question:"According to the AWS shared responsibility model, the customer is responsible for applying the latest security updates and patches for which of the following?",options:["Amazon DynamoDB","Amazon EC2 instances","Amazon RDS instances","Amazon S3"],answer:[1],is_multi:false},
{question:"Which Amazon S3 storage class is MOST cost-effective for unknown access patterns?",options:["S3 Standard","S3 Standard-Infrequent Access (S3 Standard-IA)","S3 One Zone-Infrequent Access (S3 One Zone-IA)","S3 Intelligent-Tiering"],answer:[3],is_multi:false},
{question:"Which options are AWS Cloud Adoption Framework (AWS CAF) security perspective capabilities? (Choose two.)",options:["Observability","Incident and problem management","Incident response","Infrastructure protection","Availability and continuity"],answer:[2,3],is_multi:true},
{question:"A company has a managed IAM policy that does not grant the necessary permissions for users to accomplish required tasks.\nHow can this be resolved?",options:["Enable AWS Shield Advanced.","Create a custom IAM policy.","Use a third-party web application firewall (WAF) managed rule from the AWS Marketplace.","Use AWS Key Management Service (AWS KMS) to create a customer-managed key."],answer:[1],is_multi:false},
{question:"Who is responsible for managing IAM user access and secret keys according to the AWS shared responsibility model?",options:["IAM access and secret keys are static, so there is no need to rotate them.","The customer is responsible for rotating keys.","AWS will rotate the keys whenever required.","The AWS Support team will rotate keys when requested by the customer."],answer:[1],is_multi:false},
{question:"A company needs to run a pre-installed third-party firewall on an Amazon EC2 instance.\nWhich AWS service or feature can provide this solution?",options:["Network ACLs","Security groups","AWS Marketplace","AWS Trusted Advisor"],answer:[2],is_multi:false},
{question:"Which AWS Cloud benefit gives a company the ability to quickly deploy cloud resources to access compute, storage, and database infrastructures in a matter of minutes?",options:["Elasticity","Cost savings","Agility","Reliability"],answer:[2],is_multi:false},
{question:"Which of the following is entirely the responsibility of AWS, according to the AWS shared responsibility model?",options:["Security awareness and training","Development of an IAM password policy","Patching of the guest operating system","Physical and environmental controls"],answer:[3],is_multi:false},
{question:"Which of the following is a characteristic of the AWS account root user?",options:["The root user is the only user that can be configured with multi-factor authentication (MFA).","The root user is the only user that can access the AWS Management Console.","The root user is the first sign-in identity that is available when an AWS account is created.","The root user has a password that cannot be changed."],answer:[2],is_multi:false},
{question:"An Amazon EC2 instance previously used for development is inaccessible and no longer appears in the AWS Management Console.\nWhich AWS service should be used to determine what action made this EC2 instance inaccessible?",options:["Amazon CloudWatch Logs","AWS Security Hub","Amazon Inspector","AWS CloudTrail"],answer:[3],is_multi:false},
{question:"A company's application developers need to quickly provision and manage AWS services by using scripts.\nWhich AWS offering should the developers use to meet these requirements?",options:["AWS CLI","AWS CodeBuild","AWS Cloud Adoption Framework (AWS CAF)","AWS Systems Manager Session Manager"],answer:[0],is_multi:false},
{question:"A company wants to migrate unstructured data to AWS. The data needs to be securely moved with inflight encryption and end-to-end data validation.\nWhich AWS service will meet these requirements?",options:["AWS Application Migration Service","Amazon Elastic File System (Amazon EFS)","AWS DataSync","AWS Migration Hub"],answer:[2],is_multi:false},
{question:"A development team wants to deploy multiple test environments for an application in a fast, repeatable manner.\nWhich AWS service should the team use?",options:["Amazon EC2","AWS CloudFormation","Amazon QuickSight","Amazon Elastic Container Service (Amazon ECS)"],answer:[1],is_multi:false},
{question:"A company wants to quickly implement a continuous integration/continuous delivery (CI/CD) pipeline.\nWhich AWS service will meet this requirement?",options:["AWS Config","Amazon Cognito","AWS DataSync","AWS CodeStar"],answer:[3],is_multi:false},
{question:"Which AWS Cloud deployment model uses AWS Outposts as part of the application deployment infrastructure?",options:["On-premises","Serverless","Cloud-native","Hybrid"],answer:[3],is_multi:false},
{question:"Which of the following is a fully managed graph database service on AWS?",options:["Amazon Aurora","Amazon FSx","Amazon DynamoDB","Amazon Neptune"],answer:[3],is_multi:false},
{question:"Which AWS service could an administrator use to provide desktop environments for several employees?",options:["AWS Organizations","AWS Fargate","AWS WAF","AWS WorkSpaces"],answer:[3],is_multi:false},
{question:"Which AWS service or feature gives users the ability to capture information about network traffic in a VPC?",options:["VPC Flow Logs","Amazon Inspector","VPC route tables","AWS CloudTrail"],answer:[0],is_multi:false},
{question:"Which type of AWS storage is ephemeral and is deleted when an Amazon EC2 instance is stopped or terminated?",options:["Amazon Elastic Block Store (Amazon EBS)","Amazon EC2 instance store","Amazon Elastic File System (Amazon EFS)","Amazon S3"],answer:[1],is_multi:false},
{question:"A company wants to provide access to Windows file shares in AWS from its on-premises workloads. The company does not want to provision any additional infrastructure or applications in its data center.\nWhich AWS service will meet these requirements?",options:["Amazon FSx File Gateway","AWS DataSync","Amazon S3","AWS Snow Family"],answer:[0],is_multi:false},
{question:"A company wants durable storage for static content and infinitely scalable data storage infrastructure at the lowest cost.\nWhich AWS service should the company choose?",options:["Amazon Elastic Block Store (Amazon EBS)","Amazon S3","AWS Storage Gateway","Amazon Elastic File System (Amazon EFS)"],answer:[1],is_multi:false},
{question:"An ecommerce company wants to use Amazon EC2 Auto Scaling to add and remove EC2 instances based on CPU utilization.\nWhich AWS service or feature can initiate an Amazon EC2 Auto Scaling action to achieve this goal?",options:["Amazon Simple Queue Service (Amazon SQS)","Amazon Simple Notification Service (Amazon SNS)","AWS Systems Manager","Amazon CloudWatch alarm"],answer:[3],is_multi:false},
{question:"A company wants to transform its workforce by attracting and developing a digitally fluent high-performance workforce. The company wants to attract a diverse and inclusive workforce with appropriate mix of technical and non-technical skills.\nWhich AWS Cloud Adoption Framework (AWS CAF) perspective will meet these requirements?",options:["Business","People","Platform","Operations"],answer:[1],is_multi:false},
{question:"A company wants to move its on-premises databases to managed cloud database services by using a simplified migration process.\nWhich AWS service or tool can help the company meet this requirement?",options:["AWS Storage Gateway","AWS Application Migration Service","AWS DataSync","AWS Database Migration Service (AWS DMS)"],answer:[3],is_multi:false},
{question:"A company needs a fully managed file server that natively supports Microsoft workloads and file systems. The file server must also support the SMB protocol.\nWhich AWS service should the company use to meet these requirements?",options:["Amazon Elastic File System (Amazon EFS)","Amazon FSx for Lustre","Amazon FSx for Windows File Server","Amazon Elastic Block Store (Amazon EBS)"],answer:[2],is_multi:false},
{question:"A company has been storing monthly reports in an Amazon S3 bucket. The company exports the report data into comma-separated values (.csv) files. A developer wants to write a simple query that can read all of these files and generate a summary report.\nWhich AWS service or feature should the developer use to meet these requirements with the LEAST amount of operational overhead?",options:["Amazon S3 Select","Amazon Athena","Amazon Redshift","Amazon EC2"],answer:[1],is_multi:false},
{question:"Which AWS feature provides a no-cost platform for AWS users to join community groups, ask questions, find answers, and read community-generated articles about best practices?",options:["AWS Knowledge Center","AWS re:Post","AWS IQ","AWS Enterprise Support"],answer:[1],is_multi:false},
{question:"A company needs to search for text in documents that are stored in Amazon S3.\nWhich AWS service will meet these requirements?",options:["Amazon Kendra","Amazon Rekognition","Amazon Polly","Amazon Lex"],answer:[0],is_multi:false},
{question:"Which AWS services make use of global edge locations? (Choose two.)",options:["AWS Fargate","Amazon CloudFront","AWS Global Accelerator","AWS Wavelength","Amazon VPC"],answer:[1,2],is_multi:true},
{question:"A user needs a relational database but does not have the resources to manage the hardware, resiliency, and replication.\nWhich AWS service option meets the user's requirements?",options:["Run MySQL on Amazon Elastic Container Service (Amazon ECS).","Run MySQL on Amazon EC2.","Choose Amazon RDS for MySQL.","Choose Amazon ElastiCache for Redis."],answer:[2],is_multi:false},
{question:"A company needs to deploy applications in the AWS Cloud as quickly as possible. The company also needs to minimize the complexity that is related to the management of AWS resources.\nWhich AWS service should the company use to meet these requirements?",options:["AWS Config","AWS Elastic Beanstalk","Amazon EC2","Amazon Personalize"],answer:[1],is_multi:false},
{question:"Which mechanism allows developers to access AWS services from application code?",options:["AWS Software Development Kit","AWS Management Console","AWS CodePipeline","AWS Config"],answer:[0],is_multi:false},
{question:"A company is migrating to the AWS Cloud. The company wants to understand and identify potential security misconfigurations or unexpected behaviors. The company wants to prioritize any protective controls it might need.\nWhich AWS Cloud Adoption Framework (AWS CAF) security perspective capability will meet these requirements?",options:["Identity and access management","Threat detection","Platform engineering","Availability and continuity management"],answer:[1],is_multi:false},
{question:"A company wants to establish a private network connection between AWS and its corporate network.\nWhich AWS service or feature will meet this requirement?",options:["Amazon Connect","Amazon Route 53","AWS Direct Connect","VPC peering"],answer:[2],is_multi:false},
{question:"Which AWS services or features give users the ability to create a network connection between two VPCs? (Choose two.)",options:["VPC endpoints","Amazon Route 53","VPC peering","AWS Direct Connect","AWS Transit Gateway"],answer:[2,4],is_multi:true},
{question:"Which AWS service converts text to lifelike voices?",options:["Amazon Transcribe","Amazon Rekognition","Amazon Polly","Amazon Textract"],answer:[2],is_multi:false},
{question:"A company wants to use application stacks to run a workload in the AWS Cloud. The company wants to use pre-configured instances.\nWhich AWS service will meet these requirements?",options:["Amazon Lightsail","Amazon Athena","AWS Outposts","Amazon EC2"],answer:[0],is_multi:false},
{question:"Which AWS services are supported by Savings Plans? (Choose two.)",options:["Amazon EC2","Amazon RDS","Amazon SageMaker","Amazon Redshift","Amazon DynamoDB"],answer:[0,2],is_multi:true},
{question:"Which AWS service or tool can provide rightsizing recommendations for Amazon EC2 resources at no additional cost?",options:["AWS Well-Architected Tool","Amazon CloudWatch","AWS Cost Explorer","Amazon S3 analytics"],answer:[2],is_multi:false},
{question:"A company operates a petabyte-scale data warehouse to analyze its data. The company wants a solution that will not require manual hardware and software management.\nWhich AWS service will meet these requirements?",options:["Amazon DocumentDB (with MongoDB compatibility)","Amazon Redshift","Amazon Neptune","Amazon ElastiCache"],answer:[1],is_multi:false},
{question:"A library wants to automate the classification of electronic books based on the contents of the books.\nWhich AWS service should the library use to meet this requirement?",options:["Amazon Redshift","Amazon CloudSearch","Amazon Comprehend","Amazon Aurora"],answer:[2],is_multi:false},
{question:"Which task is a responsibility of AWS, according to the AWS shared responsibility model?",options:["Encryption of application data","Authentication of application users","Protection of physical network infrastructure","Configuration of firewalls"],answer:[2],is_multi:false},
{question:"Which options are AWS Cloud Adoption Framework (AWS CAF) cloud transformation journey recommendations? (Choose two.)",options:["Envision phase","Align phase","Assess phase","Mobilize phase","Migrate and modernize phase"],answer:[0,1],is_multi:true},
{question:"A company wants to generate a list of IAM users. The company also wants to view the status of various credentials that are associated with the users, such as password, access keys, and multi-factor authentication (MFA) devices.\nWhich AWS service or feature will meet these requirements?",options:["IAM credential report","AWS IAM Identity Center (AWS Single Sign-On)","AWS Identity and Access Management Access Analyzer","AWS Cost and Usage Report"],answer:[0],is_multi:false},
{question:"A company is designing its AWS workloads so that components can be updated regularly and so that changes can be made in small, reversible increments.\nWhich pillar of the AWS Well-Architected Framework does this design support?",options:["Security","Performance efficiency","Operational excellence","Reliability"],answer:[2],is_multi:false},
{question:"A company wants to track tags, buckets, and prefixes for its Amazon S3 objects.\nWhich S3 feature will meet this requirement?",options:["S3 Inventory report","S3 Lifecycle","S3 Versioning","S3 ACLs"],answer:[0],is_multi:false},
{question:"A company wants to allow users to authenticate and authorize multiple AWS accounts by using a single set of credentials.\nWhich AWS service or resource will meet this requirement?",options:["AWS Organizations","IAM user","AWS IAM Identity Center (AWS Single Sign-On)","AWS Control Tower"],answer:[2],is_multi:false},
{question:"A company created an Amazon EC2 instance. The company wants to control the incoming and outgoing network traffic at the instance level.\nWhich AWS resource or service will meet this requirement?",options:["AWS Shield","Security groups","Network Access Analyzer","VPC endpoints"],answer:[1],is_multi:false},
{question:"A company wants to use the AWS Cloud to deploy an application globally.\nWhich architecture deployment model should the company use to meet this requirement?",options:["Multi-Region","Single-Region","Multi-AZ","Single-AZ"],answer:[0],is_multi:false},
{question:"A company wants a web application to interact with various AWS services.\nWhich AWS service or resource will meet this requirement?",options:["AWS CloudShell","AWS Marketplace","AWS Management Console","AWS CLI"],answer:[2],is_multi:false},
{question:"A company is migrating its applications from on-premises to the AWS Cloud. The company wants to ensure that the applications are assigned only the minimum permissions that are needed to perform all operations.\nWhich AWS service will meet these requirements?",options:["AWS Identity and Access Management (IAM)","Amazon CloudWatch","Amazon Macie","Amazon GuardDuty"],answer:[0],is_multi:false},
{question:"Which options are AWS Cloud Adoption Framework (AWS CAF) governance perspective capabilities? (Choose two.)",options:["Identity and access management","Cloud financial management","Application portfolio management","Innovation management","Product management"],answer:[1,2],is_multi:true},
{question:"Which AWS service provides a single location to track the progress of application migrations?",options:["AWS Application Discovery Service","AWS Application Migration Service","AWS Service Catalog","AWS Migration Hub"],answer:[3],is_multi:false},
{question:"A company launched an Amazon EC2 instance with the latest Amazon Linux 2 Amazon Machine Image (AMI).\nWhich actions can a system administrator take to connect to the EC2 instance? (Choose two.)",options:["Use Amazon EC2 Instance Connect.","Use a Remote Desktop Protocol (RDP) connection.","Use AWS Batch.","Use AWS Systems Manager Session Manager.","Use Amazon Connect."],answer:[0,3],is_multi:true},
{question:"Which architecture concept describes the ability to deploy resources on demand and release resources when they are no longer needed?",options:["High availability","Decoupled architecture","Resilience","Elasticity"],answer:[3],is_multi:false},
{question:"Which task requires a user to sign in as the AWS account root user?",options:["The deletion of IAM users","The deletion of an AWS account","The creation of an organization in AWS Organizations","The deletion of Amazon EC2 instances"],answer:[1],is_multi:false},
{question:"What does the Amazon S3 Intelligent-Tiering storage class offer?",options:["Payment flexibility by reserving storage capacity","Long-term retention of data by copying the data to an encrypted Amazon Elastic Block Store (Amazon EBS) volume","Automatic cost savings by moving objects between tiers based on access pattern changes","Secure, durable, and lowest cost storage for data archival"],answer:[2],is_multi:false},
{question:"A company needs Amazon EC2 instances for a workload that can tolerate interruptions.\nWhich EC2 instance purchasing option meets this requirement with the LARGEST discount compared to On-Demand prices?",options:["Spot Instances","Convertible Reserved Instances","Standard Reserved Instances","Dedicated Hosts"],answer:[0],is_multi:false},
{question:"A company is planning to migrate to the AWS Cloud. The company wants to identify measurable business outcomes that will explain the value of the company's decision to migrate.\nWhich phase of the cloud transformation journey includes these activities?",options:["Envision","Align","Scale","Launch"],answer:[0],is_multi:false},
{question:"Which AWS service or component allows inbound traffic from the internet to access a VPC?",options:["Internet gateway","NAT gateway","AWS WAF","VPC peering"],answer:[0],is_multi:false},
{question:"Which AWS service can companies use to create infrastructure from code?",options:["Amazon Elastic Kubernetes Service (Amazon EKS)","AWS Outposts","AWS CodePipeline","AWS CloudFormation"],answer:[3],is_multi:false},
{question:"Which guideline is a well-architected design principle for building cloud applications?",options:["Keep static data closer to compute resources.","Provision resources for peak capacity.","Design for automated recovery from failure.","Use tightly coupled components."],answer:[2],is_multi:false},
{question:"A company needs to move 75 petabytes of data from its on-premises data centers to AWS.\nWhich AWS service should the company use to meet these requirements MOST cost-effectively?",options:["AWS Snowball Edge Storage Optimized","AWS Snowmobile","AWS Direct Connect","AWS Storage Gateway"],answer:[1],is_multi:false},
{question:"Which of the following are pillars of the AWS Well-Architected Framework? (Choose two.)",options:["Resource scalability","Performance efficiency","System elasticity","Agile development","Operational excellence"],answer:[1,4],is_multi:true},
{question:"A company needs to connect its on-premises data center to the AWS Cloud. The company needs a dedicated, low-latency connection with consistent network performance.\nWhich AWS service will meet these requirements?",options:["AWS Global Accelerator","Amazon CloudFront","AWS Direct Connect","AWS Managed VPN"],answer:[2],is_multi:false},
{question:"Which design principles should a company apply to AWS Cloud workloads to maximize sustainability and minimize environmental impact? (Choose two.)",options:["Maximize utilization of Amazon EC2 instances.","Minimize utilization of Amazon EC2 instances.","Minimize usage of managed services.","Force frequent application reinstallations by users.","Reduce the need for users to reinstall applications."],answer:[0,4],is_multi:true},
{question:"In which ways does the AWS Cloud offer lower total cost of ownership (TCO) of computing resources than on-premises data centers? (Choose two.)",options:["AWS replaces upfront capital expenditures with pay-as-you-go costs.","AWS is designed for high availability, which eliminates user downtime.","AWS eliminates the need for on-premises IT staff.","AWS uses economies of scale to continually reduce prices.","AWS offers a single pricing model for Amazon EC2 instances."],answer:[0,3],is_multi:true},
{question:"A company wants to deploy some of its resources in the AWS Cloud. To meet regulatory requirements, the data must remain local and on premises. There must be low latency between AWS and the company resources.\nWhich AWS service or feature can be used to meet these requirements?",options:["AWS Local Zones","Availability Zones","AWS Outposts","AWS Wavelength Zones"],answer:[2],is_multi:false},
{question:"Which of the following AWS services are serverless? (Choose two.)",options:["AWS Outposts","Amazon EC2","Amazon Elastic Kubernetes Service (Amazon EKS)","AWS Fargate","AWS Lambda"],answer:[3,4],is_multi:true},
{question:"When a user wants to utilize their existing per-socket, per-core, or per-virtual machine software licenses for a Microsoft Windows server running on AWS, which Amazon EC2 instance type is required?",options:["Spot Instances","Dedicated Instances","Dedicated Hosts","Reserved Instances"],answer:[2],is_multi:false},
{question:"A solutions architect needs to maintain a fleet of Amazon EC2 instances so that any impaired instances are replaced with new ones.\nWhich AWS service should the solutions architect use?",options:["Amazon Elastic Container Service (Amazon ECS)","Amazon GuardDuty","AWS Shield","AWS Auto Scaling"],answer:[3],is_multi:false},
{question:"Which AWS service provides on-premises applications with low-latency access to data that is stored in the AWS Cloud?",options:["Amazon CloudFront","AWS Storage Gateway","AWS Backup","AWS DataSync"],answer:[1],is_multi:false},
{question:"What does Amazon CloudFront provide?",options:["Automatic scaling for all resources to power an application from a single unified interface","Secure delivery of data, videos, applications, and APIs to users globally with low latency","Ability to directly manage traffic globally through a variety of routing types, including latency-based routing, geo DNS, geoproximity, and weighted round robin","Automatic distribution of incoming application traffic across multiple targets, such as Amazon EC2 instances, containers, IP addresses, and AWS Lambda functions"],answer:[1],is_multi:false},
{question:"Which AWS service supports the deployment and management of applications in the AWS Cloud?",options:["Amazon CodeGuru","AWS Fargate","AWS CodeCommit","AWS Elastic Beanstalk"],answer:[3],is_multi:false},
{question:"A company wants to integrate natural language processing (NLP) into business intelligence (BI) dashboards. The company wants to ask questions and receive answers with relevant visualizations.\nWhich AWS service or tool will meet these requirements?",options:["Amazon Macie","Amazon Rekognition","Amazon QuickSight Q","Amazon Lex"],answer:[2],is_multi:false},
{question:"Which Amazon S3 feature or storage class uses the AWS backbone network and edge locations to reduce latencies from the end user to Amazon S3?",options:["S3 Cross-Region Replication","S3 Transfer Acceleration","S3 Event Notifications","S3 Standard-Infrequent Access (S3 Standard-IA)"],answer:[1],is_multi:false},
{question:"Which AWS service provides the ability to host a NoSQL database in the AWS Cloud?",options:["Amazon Aurora","Amazon DynamoDB","Amazon RDS","Amazon Redshift"],answer:[1],is_multi:false},
{question:"Which AWS service is a relational database compatible with MySQL and PostgreSQL?",options:["Amazon Redshift","Amazon DynamoDB","Amazon Aurora","Amazon Neptune"],answer:[2],is_multi:false},
{question:"Which architecture design principle describes the need to isolate failures between dependent components in the AWS Cloud?",options:["Use a monolithic design.","Design for automation.","Design for single points of failure.","Loosely couple components."],answer:[3],is_multi:false},
{question:"Which benefit of cloud computing gives a company the ability to deploy applications to users all over the world through a network of AWS Regions, Availability Zones, and edge locations?",options:["Economy of scale","Global reach","Agility","High availability"],answer:[1],is_multi:false},
{question:"Which AWS service makes it easier to monitor and troubleshoot application logs and cloud resources?",options:["Amazon EC2","AWS Identity and Access Management (IAM)","Amazon CloudWatch","AWS CloudTrail"],answer:[2],is_multi:false},
{question:"Which AWS service uses AWS Compute Optimizer to provide sizing recommendations based on workload metrics?",options:["Amazon EC2","Amazon RDS","Amazon Lightsail","AWS Step Functions"],answer:[0],is_multi:false},
{question:"Which AWS service will help a company plan a migration to AWS by collecting the configuration, usage, and behavior data of on-premises data centers?",options:["AWS Resource Groups","AWS Application Discovery Service","AWS Service Catalog","AWS Systems Manager"],answer:[1],is_multi:false},
{question:"Which AWS service uses a combination of publishers and subscribers?",options:["AWS Lambda","Amazon Simple Notification Service (Amazon SNS)","Amazon CloudWatch","AWS CloudFormation"],answer:[1],is_multi:false},
{question:"A company is in the early stages of planning a migration to AWS. The company wants to obtain the monthly predicted total AWS cost of ownership for future Amazon EC2 instances and associated storage.\nWhich AWS service or tool should the company use to meet these requirements?",options:["AWS Pricing Calculator","AWS Compute Optimizer","AWS Trusted Advisor","AWS Application Migration Service"],answer:[0],is_multi:false},
{question:"Which AWS service or tool will monitor AWS resources and applications in real time?",options:["AWS Trusted Advisor","Amazon CloudWatch","AWS CloudTrail","AWS Cost Explorer"],answer:[1],is_multi:false},
{question:"Which AWS Cloud Adoption Framework (AWS CAF) capability belongs to the business perspective?",options:["Program and project management","Data science","Observability","Change and release management"],answer:[1],is_multi:false},
{question:"Which AWS resource can help a company reduce its costs in exchange for a usage commitment when using Amazon EC2 instances?",options:["Compute Savings Plans","Auto Scaling group","On-Demand Instance","EC2 instance store"],answer:[0],is_multi:false},
{question:"Which perspective in the AWS Cloud Adoption Framework (AWS CAF) includes a capability for well-designed data and analytics architecture?",options:["Security","Governance","Operations","Platform"],answer:[3],is_multi:false},
{question:"Which options are AWS Cloud Adoption Framework (AWS CAF) people perspective capabilities? (Choose two.)",options:["Organizational alignment","Portfolio management","Organization design","Risk management","Modern application development"],answer:[0,2],is_multi:true},
{question:"A company needs a bridge between technology and business to help evolve to a culture of continuous growth and learning.\nWhich perspective in the AWS Cloud Adoption Framework (AWS CAF) serves as this bridge?",options:["People","Governance","Operations","Security"],answer:[0],is_multi:false},
{question:"Which option is a responsibility of AWS under the AWS shared responsibility model?",options:["Application data security","Patch management for applications that run on Amazon EC2 instances","Patch management of the underlying infrastructure for managed services","Application identity and access management"],answer:[2],is_multi:false},
{question:"Which AWS service or resource can identify and provide reports on IAM resources in one AWS account that is shared with another AWS account?",options:["IAM credential report","AWS IAM Identity Center (AWS Single Sign-On)","AWS Identity and Access Management Access Analyzer","Amazon Cognito user pool"],answer:[2],is_multi:false},
{question:"Which AWS Well-Architected Framework pillar focuses on structured and streamlined allocation of computing resources?",options:["Reliability","Operational excellence","Performance efficiency","Sustainability"],answer:[2],is_multi:false},
{question:"Which AWS Cloud Adoption Framework (AWS CAF) capabilities belong to the governance perspective? (Choose two.)",options:["Program and project management","Product management","Portfolio management","Risk management","Event management"],answer:[0,3],is_multi:true},
{question:"A company wants to use AWS Managed Services (AMS) for operational support and wants to understand the scope of AMS.\nWhich AMS feature will meet these requirements?",options:["Landing zone and network management","Customer application development","DevSecOps pipeline configuration","Application log monitoring"],answer:[0],is_multi:false},
{question:"A company wants to migrate its on-premises NoSQL workload to Amazon DynamoDB.\nWhich AWS service will meet this requirement?",options:["AWS Migration Hub","AWS Database Migration Service (AWS DMS)","Migration Evaluator","AWS Application Migration Service"],answer:[1],is_multi:false},
{question:"A company is in the process of finding correct Amazon EC2 instance types and sizes to meet its performance and capacity requirements. The company wants to find the lowest possible cost.\nWhich option accurately characterizes the company's actions?",options:["Auto Scaling","Storage tiering","Rightsizing","Instance scheduling"],answer:[2],is_multi:false},
{question:"A company wants to manage sign-in security for workforce users. The company needs to create workforce users and centrally manage their access across all the company's AWS accounts and applications.\nWhich AWS service will meet these requirements?",options:["AWS Audit Manager","Amazon Cognito","AWS Security Hub","AWS IAM Identity Center (AWS Single Sign-On)"],answer:[3],is_multi:false},
{question:"A company wants a report that lists the status of multi-factor authentication (MFA) devices that all users in the company's AWS account use.\nWhich AWS feature or service will meet this requirement?",options:["AWS Cost and Usage Reports","IAM credential reports","Detailed Billing Reports","AWS Cost Explorer reports"],answer:[1],is_multi:false},
{question:"A company wants to use machine learning capabilities to analyze log data from its Amazon EC2 instances and efficiently conduct security investigations.\nWhich AWS service will meet these requirements?",options:["Amazon Inspector","Amazon QuickSight","Amazon Detective","Amazon GuardDuty"],answer:[2],is_multi:false},
{question:"A company is launching a mobile app in the AWS Cloud. The company wants the app's users to sign in through social media identity providers (IdPs).\nWhich AWS service will meet this requirement?",options:["AWS Lambda","Amazon Cognito","AWS Secrets Manager","Amazon CloudFront"],answer:[1],is_multi:false},
{question:"Which complimentary AWS service or tool creates data-driven business cases for cloud planning?",options:["Migration Evaluator","AWS Billing Conductor","AWS Billing Console","Amazon Forecast"],answer:[0],is_multi:false},
{question:"Which cloud concept is demonstrated by using AWS Cost Explorer?",options:["Rightsizing","Reliability","Resilience","Modernization"],answer:[0],is_multi:false},
{question:"A company wants to deploy a non-containerized Java-based web application on AWS. The company wants to use a managed service to quickly deploy the application. The company wants the service to automatically provision capacity, load balance, scale, and monitor application health.\nWhich AWS service will meet these requirements?",options:["Amazon Elastic Container Service (Amazon ECS)","AWS Lambda","Amazon Elastic Kubernetes Service (Amazon EKS)","AWS Elastic Beanstalk"],answer:[3],is_multi:false},
{question:"Which AWS service or tool gives users the ability to connect with AWS and deploy resources programmatically?",options:["Amazon QuickSight","AWS PrivateLink","AWS Direct Connect","AWS SDKs"],answer:[3],is_multi:false},
{question:"A company has deployed a web application to Amazon EC2 instances. The EC2 instances have low usage.\nWhich AWS service or feature should the company use to rightsize the EC2 instances?",options:["AWS Config","AWS Cost Anomaly Detection","AWS Budgets","AWS Compute Optimizer"],answer:[3],is_multi:false},
{question:"A company wants to define a central data protection policy that works across AWS services for compute, storage, and database resources.\nWhich AWS service will meet this requirement?",options:["AWS Batch","AWS Elastic Disaster Recovery","AWS Backup","Amazon FSx"],answer:[2],is_multi:false},
{question:"A company needs to categorize and track AWS usage cost based on business categories.\nWhich AWS service or feature should the company use to meet these requirements?",options:["Cost allocation tags","AWS Organizations","AWS Security Hub","AWS Cost and Usage Report"],answer:[0],is_multi:false},
{question:"Which AWS service can migrate data between AWS storage services?",options:["AWS DataSync","AWS Direct Connect","AWS Lake Formation","Amazon S3"],answer:[0],is_multi:false},
{question:"Which statements represent the cost-effectiveness of the AWS Cloud? (Choose two.)",options:["Users can trade fixed expenses for variable expenses.","Users can deploy all over the world in minutes.","AWS offers increased speed and agility.","AWS is responsible for patching the infrastructure.","Users benefit from economies of scale."],answer:[0,4],is_multi:true},
{question:"A company wants to design its cloud architecture so that it can support development innovations, and continuously improve processes and procedures.\nThis is an example of which pillar of the AWS Well-Architected Framework?",options:["Security","Performance efficiency","Operational excellence","Reliability"],answer:[2],is_multi:false},
{question:"A company needs to consolidate the billing for multiple AWS accounts. The company needs to use one account to pay on behalf of all the other accounts.\nWhich AWS service or tool should the company use to meet this requirement?",options:["AWS Trusted Advisor","AWS Organizations","AWS Budgets","AWS Service Catalog"],answer:[1],is_multi:false},
{question:"A company is moving some of its on-premises IT services to the AWS Cloud. The finance department wants to see the entire bill so it can forecast spending limits.\nWhich AWS service can the company use to set spending limits and receive notifications if those limits are exceeded?",options:["AWS Cost and Usage Reports","AWS Budgets","AWS Organizations consolidated billing","Cost Explorer"],answer:[1],is_multi:false},
{question:"Which AWS Support plans provide access to an AWS technical account manager (TAM)? (Choose two.)",options:["AWS Basic Support","AWS Developer Support","AWS Business Support","AWS Enterprise On-Ramp Support","AWS Enterprise Support"],answer:[3,4],is_multi:true},
{question:"Where can users find examples of AWS Cloud solution designs?",options:["AWS Marketplace","AWS Service Catalog","AWS Architecture Center","AWS Trusted Advisor"],answer:[2],is_multi:false},
{question:"Which task is the responsibility of a company that is using Amazon RDS?",options:["Provision the underlying infrastructure.","Create IAM policies to control administrative access to the service.","Install the cables to connect the hardware for compute and storage.","Install and patch the RDS operating system."],answer:[1],is_multi:false},
{question:"Which of the following is an advantage that the AWS Cloud provides to users?",options:["Users eliminate the need to guess about infrastructure capacity requirements.","Users decrease their variable costs by maintaining sole ownership of IT hardware.","Users maintain control of underlying IT infrastructure hardware.","Users maintain control of operating systems for managed services."],answer:[0],is_multi:false},
{question:"Which feature of Amazon RDS provides the ability to automatically create a primary database instance and to synchronously replicate data to an instance in another Availability Zone?",options:["Read replicas","Blue/green deployment","Multi-AZ deployment","Reserved Instances"],answer:[2],is_multi:false},
{question:"A company needs to check for IAM access keys that have not been rotated recently.\nWhich AWS service should the company use to meet this requirement?",options:["AWS WAF","AWS Shield","Amazon Cognito","AWS Trusted Advisor"],answer:[3],is_multi:false},
{question:"A company runs many Amazon EC2 instances in its VPC. The company wants to use a native AWS security resource to control network traffic between certain EC2 instances.\nWhich AWS service or feature will meet this requirement?",options:["Network ACLs","AWS WAF","Amazon GuardDuty","Security groups"],answer:[3],is_multi:false},
{question:"Which of the following can be components of a VPC in the AWS Cloud? (Choose two.)",options:["Amazon API Gateway","Amazon S3 buckets and objects","AWS Storage Gateway","Internet gateway","Subnet"],answer:[3,4],is_multi:true},
{question:"A company is building a new application on AWS. The company needs the application to remain available if an individual application component fails.\nWhich design principle should the company use to meet this requirement?",options:["Disposable resources","Automation","Rightsizing","Loose coupling"],answer:[3],is_multi:false},
{question:"A company wants to use a managed service to identify and protect sensitive data that is stored in Amazon S3.\nWhich AWS service will meet these requirements?",options:["AWS IAM Access Analyzer","Amazon GuardDuty","Amazon Inspector","Amazon Macie"],answer:[3],is_multi:false},
{question:"Which AWS service or feature can a user configure to limit network access at the subnet level?",options:["AWS Shield","AWS WAF","Network ACL","Security group"],answer:[2],is_multi:false},
{question:"Which AWS service can a company use to manage encryption keys in the cloud?",options:["AWS License Manager","AWS Certificate Manager (ACM)","AWS CloudHSM","AWS Directory Service"],answer:[2],is_multi:false},
{question:"A company wants to enhance security by launching a third-party ISP intrusion detection system from its AWS account.\nWhich AWS service or resource should the company use to meet this requirement?",options:["AWS Security Hub","AWS Marketplace","AWS Quick Starts","AWS Security Center"],answer:[1],is_multi:false},
{question:"How does the AWS Cloud help companies build agility into their processes and cloud infrastructure?",options:["Companies can avoid provisioning too much capacity when they do not know how much capacity is required.","Companies can expand into new geographic regions.","Companies can access a range of technologies to experiment and innovate quickly.","Companies can pay for IT resources only when they use the resources."],answer:[2],is_multi:false},
{question:"Which AWS service or tool gives a company the ability to release application changes in an automated way?",options:["Amazon AppFlow","AWS CodeDeploy","AWS PrivateLink","Amazon EKS Distro"],answer:[1],is_multi:false},
{question:"Which AWS Cloud Adoption Framework (AWS CAF) perspective focuses on managing identities and permissions at scale?",options:["Operations","Platform","Governance","Security"],answer:[3],is_multi:false},
{question:"Which AWS service or feature allows users to securely store encrypted credentials and retrieve these credentials when required?",options:["AWS Encryption SDK","AWS Security Hub","AWS Secrets Manager","AWS Artifact"],answer:[2],is_multi:false},
{question:"Which pillar of the AWS Well-Architected Framework aligns with the ability to make frequent, small, and reversible changes to AWS Cloud architecture?",options:["Security","Cost optimization","Operational excellence","Performance efficiency"],answer:[2],is_multi:false},
{question:"Which AWS service or resource can a company use to deploy AWS WAF rules?",options:["Amazon EC2","Application Load Balancer","AWS Trusted Advisor","Network Load Balancer"],answer:[1],is_multi:false},
{question:"A company hosts its website on Amazon EC2 instances. The company needs to ensure that the website reaches a global audience and provides minimum latency to users.\nWhich AWS service should the company use to meet these requirements?",options:["Amazon Route 53","Amazon CloudFront","Elastic Load Balancing","AWS Lambda"],answer:[1],is_multi:false},
{question:"Which AWS design principle emphasizes the reduction of interdependencies between components of an application?",options:["Scalability","Loose coupling","Automation","Caching"],answer:[1],is_multi:false},
{question:"A company wants to provide one of its employees with access to Amazon RDS. The company also wants to limit the interaction to only the AWS CLI and AWS software development kits (SDKs).\nWhich combination of actions should the company take to meet these requirements while following the principles of least privilege? (Choose two.)",options:["Create an IAM user and provide AWS Management Console access only.","Create an IAM user and provide programmatic access only.","Create an IAM role and provide AWS Management Console access only.","Create an IAM policy with administrator access and attach it to the IAM user.","Create an IAM policy with Amazon RDS access and attach it to the IAM user."],answer:[1,4],is_multi:true},
{question:"A company is running a reporting web server application on Amazon EC2 instances. The application runs once every week and once again at the end of the month. The EC2 instances can be shut down when they are not in use.\nWhat is the MOST cost-effective billing model for this use case?",options:["Standard Reserved Instances","Convertible Reserved Instances","On-Demand Capacity Reservations","On-Demand Instances"],answer:[3],is_multi:false},
{question:"A company wants to discover, prepare, move, and integrate data from multiple sources for data analytics and machine learning.\nWhich AWS serverless data integration service should the company use to meet these requirements?",options:["AWS Glue","AWS Data Exchange","Amazon Athena","Amazon EMR"],answer:[0],is_multi:false},
{question:"A company is moving its development and test environments to AWS to increase agility and reduce cost. Because these are not production workloads and the servers are not fully utilized, occasional unavailability is acceptable.\nWhat is the MOST cost-effective Amazon EC2 pricing model that will meet these requirements?",options:["Reserved Instances","On-Demand Instances","Spot Instances","Dedicated Hosts"],answer:[2],is_multi:false},
{question:"A company deploys its application on Amazon EC2 instances. The application occasionally experiences sudden increases in demand. The company wants to ensure that its application can respond to changes in demand at the lowest possible cost.\nWhich AWS service or concept will meet these requirements?",options:["AWS Auto Scaling","AWS Compute Optimizer","AWS Cost Explorer","AWS Well-Architected Framework"],answer:[0],is_multi:false},
{question:"A company wants to organize its users so that the company can grant permissions to the users as a group.\nWhich AWS service or tool can the company use to meet this requirement?",options:["Security groups","AWS Identity and Access Management (IAM)","Resource groups","AWS Security Hub"],answer:[1],is_multi:false},
{question:"A company wants to build an application that uses AWS Lambda to run Python code.\nUnder the AWS shared responsibility model, which tasks will be the company's responsibility? (Choose two.)",options:["Management of the underlying infrastructure.","Management of the operating system.","Writing the business logic code.","Installation of the computer language runtime.","Providing AWS Identity and Access Management (IAM) access to the Lambda service."],answer:[2,4],is_multi:true},
{question:"A company needs to identify who accessed an AWS service and what action was performed for a given time period.\nWhich AWS service should the company use to meet this requirement?",options:["Amazon CloudWatch","AWS CloudTrail","AWS Security Hub","Amazon Inspector"],answer:[1],is_multi:false},
{question:"A company wants to use a centralized AWS service to enforce compliance with the organizational business standards. The company wants to use an AWS service that can govern and control who can deploy, manage, and decommission AWS resources.\nWhich AWS service will meet these requirements?",options:["Amazon CloudWatch","AWS Service Catalog","Amazon GuardDuty","AWS Security Hub"],answer:[1],is_multi:false},
{question:"What does \"security of the cloud\" refer to in the AWS shared responsibility model?",options:["Availability of AWS services such as Amazon EC2","Security of the cloud infrastructure that runs all the AWS services","Implementation of password policies for IAM users","Security of customer environments by using AWS Network Firewall partners"],answer:[1],is_multi:false},
{question:"A company has an application that produces unstructured data continuously. The company needs to store the data so that the data is durable and easy to query.\nWhich AWS service can the company use to meet these requirements?",options:["Amazon RDS","Amazon Aurora","Amazon QuickSight","Amazon DynamoDB"],answer:[3],is_multi:false},
{question:"Which options are AWS Cloud Adoption Framework (AWS CAF) perspectives? (Choose two.)",options:["Cloud fluency","Security","Change acceleration","Architecture","Business"],answer:[1,4],is_multi:true},
{question:"A company wants to migrate a company's on-premises container infrastructure to the AWS Cloud. The company wants to prevent unplanned administration and operation cost and adapt to a serverless architecture.\nWhich AWS service will meet these requirements?",options:["Amazon Connect","AWS Fargate","Amazon Lightsail","Amazon EC2"],answer:[1],is_multi:false},
{question:"A company wants its Amazon EC2 instances to be in different locations but share the same geographic area. The company also wants to use multiple power grids and independent networking connectivity for the EC2 instances.\nWhich solution meets these requirements?",options:["Use EC2 instances in multiple edge locations in the same AWS Region.","Use EC2 instances in multiple Availability Zones in the same AWS Region.","Use EC2 instances in multiple Amazon Connect locations in the same AWS Region.","Use EC2 instances in multiple AWS Artifact locations in the same AWS Region."],answer:[1],is_multi:false},
{question:"An ecommerce company has deployed a new web application on Amazon EC2 instances. The company wants to distribute incoming HTTP traffic evenly across all running instances.\nWhich AWS service or resource will meet this requirement?",options:["Amazon EC2 Auto Scaling","Application Load Balancer","Gateway Load Balancer","Network Load Balancer"],answer:[1],is_multi:false},
{question:"Which AWS service or feature gives users the ability to connect VPCs and on-premises networks to a central hub?",options:["Virtual private gateway","AWS Transit Gateway","Internet gateway","Customer gateway"],answer:[1],is_multi:false},
{question:"A company wants to run CPU-intensive workload across multiple Amazon EC2 instances.\nWhich EC2 instance type should the company use to meet this requirement?",options:["General purpose instances","Compute optimized instances","Memory optimized instances","Storage optimized instances"],answer:[1],is_multi:false},
{question:"A company is connecting multiple VPCs and on-premises networks. The company needs to use an AWS service as a cloud router to simplify peering relationships.\nWhich AWS service can the company use to meet this requirement?",options:["AWS Direct Connect","AWS Transit Gateway","Amazon Connect","Amazon Route 53"],answer:[0],is_multi:false},
{question:"A company stores a large amount of data that auditors access only twice each year.\nWhich Amazon S3 storage class should the company use to store the data with the LOWEST cost?",options:["Amazon S3 Outposts","Amazon S3 Glacier Instant Retrieval","Amazon S3 Standard","Amazon S3 Intelligent-Tiering"],answer:[3],is_multi:false},
{question:"Which action should a company take to improve security in its AWS account?",options:["Require multi-factor authentication (MFA) for privileged users.","Remove the root user account.","Create an access key for the AWS account root user.","Create an access key for each privileged user."],answer:[0],is_multi:false},
{question:"Which of the following are ways to improve security on AWS? (Choose two.)",options:["Using AWS Artifact","Granting the broadest permissions to all IAM roles","Running application code with AWS Cloud","Enabling multi-factor authentication (MFA) with Amazon Cognito","Using AWS Trusted Advisor security checks"],answer:[3,4],is_multi:true},
{question:"Which AWS service can a company use to manage encryption keys in the cloud?",options:["AWS License Manager","AWS Certificate Manager (ACM)","AWS CloudHSM","AWS Directory Service"],answer:[2],is_multi:false},
{question:"A company wants to store its files in the AWS Cloud. Users need to be able to download these files directly using a public URL.\nWhich AWS service or feature will meet this requirement?",options:["Amazon Redshift","Amazon Elastic Block Store (Amazon EBS)","Amazon Elastic File System (Amazon EFS)","Amazon S3"],answer:[3],is_multi:false},
{question:"A company is using AWS for all its IT infrastructure. The company's developers are allowed to deploy applications on their own. The developers want to deploy their applications without having to provision the infrastructure themselves.\nWhich AWS service should the developers use to meet these requirements?",options:["AWS CloudFormation","AWS CodeBuild","AWS Elastic Beanstalk","AWS CodeDeploy"],answer:[2],is_multi:false},
{question:"A company wants to gain insights from its data and build interactive data visualization dashboards.\nWhich AWS service will meet these requirements?",options:["Amazon SageMaker","Amazon Rekognition","Amazon QuickSight","Amazon Kinesis"],answer:[2],is_multi:false},
{question:"A cloud engineer wants to store data in Amazon S3. The engineer will access some of the data yearly and some of the data daily.\nWhich S3 storage class will meet these requirements MOST cost-effectively?",options:["S3 Standard","S3 Glacier Deep Archive","S3 One Zone-Infrequent Access (S3 One Zone-IA)","S3 Intelligent-Tiering"],answer:[3],is_multi:false},
{question:"Which of the following are economic benefits of using the AWS Cloud? (Choose two.)",options:["Consumption-based pricing","Perpetual licenses","Economies of scale","AWS Enterprise Support at no additional cost","Bring-your-own-hardware model"],answer:[0,2],is_multi:true},
{question:"A user is moving a workload from a local data center to an architecture that is distributed between the local data center and the AWS Cloud.\nWhich type of migration is this?",options:["On-premises to cloud native","Hybrid to cloud native","On-premises to hybrid","Cloud native to hybrid"],answer:[2],is_multi:false},
{question:"A company needs to store infrequently used data for data archives and long-term backups.\nWhich AWS service or storage class will meet these requirements MOST cost-effectively?",options:["Amazon FSx for Lustre","Amazon Elastic Block Store (Amazon EBS)","Amazon Elastic File System (Amazon EFS)","Amazon S3 Glacier Flexible Retrieval"],answer:[3],is_multi:false},
{question:"Which AWS service provides users with AWS issued reports, certifications, accreditations, and third-party attestations?",options:["AWS Artifact","AWS Trusted Advisor","AWS Health Dashboard","AWS Config"],answer:[0],is_multi:false},
{question:"A company needs to create and publish interactive business intelligence dashboards. The dashboards require insights that are powered by machine learning.\nWhich AWS service or tool will meet these requirements?",options:["AWS Glue Studio","Amazon QuickSight","Amazon Redshift","Amazon Athena"],answer:[1],is_multi:false},
{question:"A company wants to use AWS. The company has stringent requirements about low-latency access to on-premises systems and data residency.\nWhich AWS service should the company use to design a solution that meets these requirements?",options:["AWS Wavelength","AWS Transit Gateway","AWS Ground Station","AWS Outposts"],answer:[3],is_multi:false},
{question:"A company runs an on-premises contact center for customers. The company needs to migrate to a cloud-based solution that can deliver artificial intelligence features to improve user experience.\nWhich AWS service will meet these requirements?",options:["AWS Wavelength","AWS IAM Identity Center (AWS Single Sign-On)","AWS Direct Connect","Amazon Connect"],answer:[3],is_multi:false},
{question:"A company needs the ability to acquire resources when the resources are needed. The company also needs the ability to release the resources when the resources are no longer needed.\nWhich AWS concept represents the company's goals?",options:["Scalability","Sustainability","Elasticity","Operational excellence"],answer:[2],is_multi:false},
{question:"A company wants to use Amazon EC2 instances for a stable production workload that will run for 1 year.\nWhich instance purchasing option meets these requirements MOST cost-effectively?",options:["Dedicated Hosts","Reserved Instances","On-Demand Instances","Spot Instances"],answer:[1],is_multi:false},
{question:"A company wants to log in securely to Linux Amazon EC2 instances.\nHow can the company accomplish this goal?",options:["Use SSH keys.","Use a VPN.","Use end-to-end encryption.","Use Amazon Route 53."],answer:[0],is_multi:false},
{question:"A company wants to use a serverless compute service for an application.\nWhich AWS service will meet this requirement?",options:["AWS Lambda","AWS CloudFormation","AWS Elastic Beanstalk","Elastic Load Balancing"],answer:[0],is_multi:false},
{question:"A company wants a solution that will automatically adjust the number of Amazon EC2 instances that are being used based on the current load.\nWhich AWS offering will meet these requirements?",options:["Dedicated Hosts","Placement groups","Auto Scaling groups","Reserved Instances"],answer:[2],is_multi:false},
{question:"A company is building AWS architecture to deliver real-time data feeds from an on-premises data center into an application that runs on AWS. The company needs a consistent network connection with minimal latency.\nWhat should the company use to connect the application and the data center to meet these requirements?",options:["AWS Direct Connect","Public internet","AWS VPN","Amazon Connect"],answer:[0],is_multi:false},
{question:"A company plans to migrate its custom marketing application and order-processing application to AWS. The company needs to deploy the applications on different types of instances with various configurations of CPU, memory, storage, and networking capacity.\nWhich AWS service should the company use to meet these requirements?",options:["AWS Lambda","Amazon Cognito","Amazon Athena","Amazon EC2"],answer:[3],is_multi:false},
{question:"A company wants to monitor and block malicious HTTP and HTTPS requests that its Amazon CloudFront distributions receive.\nWhich AWS service should the company use to meet these requirements?",options:["Amazon GuardDuty","Amazon Inspector","AWS WAF","Amazon Detective"],answer:[2],is_multi:false},
{question:"Which AWS services can host PostgreSQL databases? (Choose two.)",options:["Amazon S3","Amazon Aurora","Amazon EC2","Amazon OpenSearch Service","Amazon Elastic File System (Amazon EFS)"],answer:[1,2],is_multi:true},
{question:"Which AWS service can generate information that can be used by external auditors?",options:["Amazon Cognito","Amazon FSx","AWS Config","Amazon Inspector"],answer:[2],is_multi:false},
{question:"Which AWS service or feature requires an internet service provider (ISP) and a colocation facility to be implemented?",options:["AWS VPN","Amazon Connect","AWS Direct Connect","Internet gateway"],answer:[2],is_multi:false},
{question:"A company wants its Amazon EC2 instances to operate in a highly available environment, even if there is a natural disaster in a particular geographic area.\nWhich solution achieves this goal?",options:["Use EC2 instances in multiple AWS Regions.","Use EC2 instances in multiple edge locations.","Use EC2 instances in the same Availability Zone but in different AWS Regions.","Use Amazon CloudFront with the EC2 instances configured as the source."],answer:[0],is_multi:false},
{question:"Which AWS service allows for file sharing between multiple Amazon EC2 instances?",options:["AWS Direct Connect","AWS Snowball Edge","AWS Backup","Amazon Elastic File System (Amazon EFS)"],answer:[3],is_multi:false},
{question:"A company needs to manage multiple logins across AWS accounts within the same organization in AWS Organizations.\nWhich AWS service should the company use to meet this requirement?",options:["Amazon VPC","Amazon GuardDuty","Amazon Cognito","AWS IAM Identity Center"],answer:[3],is_multi:false},
{question:"A company uses Amazon WorkSpaces.\nWhich task is the responsibility of AWS, according to the AWS shared responsibility model?",options:["Set up multi-factor authentication (MFA) for each WorkSpaces user account.","Ensure the environmental safety and security of the AWS infrastructure that hosts WorkSpaces.","Provide security for WorkSpaces user accounts through AWS Identity and Access Management (IAM).","Configure AWS CloudTrail to log API calls and user activity."],answer:[1],is_multi:false},
{question:"A company is migrating its public website to AWS. The company wants to host the domain name for the website on AWS.\nWhich AWS service should the company use to meet this requirement?",options:["AWS Lambda","Amazon Route 53","Amazon CloudFront","AWS Direct Connect"],answer:[1],is_multi:false},
{question:"A company uses a third-party identity provider (IdP). The company wants to provide its employees with access to AWS accounts and services without requiring another set of login credentials.\nWhich AWS service will meet this requirement?",options:["AWS Directory Service","Amazon Cognito","AWS IAM Identity Center","AWS Resource Access Manager (AWS RAM)"],answer:[2],is_multi:false},
{question:"Which combination of AWS services can be used to move a commercial relational database to an Amazon-managed open-source database? (Choose two.)",options:["AWS Database Migration Service (AWS DMS)","AWS software development kits (SDKs)","AWS Schema Conversion Tool","AWS Systems Manager","Amazon EMR"],answer:[0,2],is_multi:true},
{question:"Which AWS service gives users on-demand, self-service access to AWS compliance control reports?",options:["AWS Config","Amazon GuardDuty","AWS Trusted Advisor","AWS Artifact"],answer:[3],is_multi:false},
{question:"A company runs a legacy workload in an on-premises data center. The company wants to migrate the workload to AWS. The company does not want to make any changes to the workload.\nWhich migration strategy should the company use?",options:["Repurchase","Replatform","Rehost","Refactor"],answer:[2],is_multi:false},
{question:"A company is planning to migrate applications to the AWS Cloud. During a system audit, the company finds that its content management system (CMS) application is incompatible with cloud environments.\nWhich migration strategies will help the company to migrate the CMS application with the LEAST effort? (Choose two.)",options:["Retire","Rehost","Repurchase","Replatform","Refactor"],answer:[1,2],is_multi:true},
{question:"Which of the following are AWS best practice recommendations for the use of AWS Identity and Access Management (IAM)? (Choose two.)",options:["Use the AWS account root user for daily access.","Use access keys and secret access keys on Amazon EC2.","Rotate credentials on a regular basis.","Create a shared set of access keys for system administrators.","Configure multi-factor authentication (MFA)."],answer:[2,4],is_multi:true},
{question:"Which option is AWS responsible for under the AWS shared responsibility model?",options:["Network and firewall configuration","Client-side data encryption","Management of user permissions","Hardware and infrastructure"],answer:[3],is_multi:false},
{question:"A company wants to run a graph query that provides credit card users' names, addresses, and transactions. The company wants the graph to show if the names, addresses, and transactions indicates possible fraud.\nWhich AWS database service will meet these requirements?",options:["Amazon DocumentDB (with MongoDB compatibility)","Amazon Timestream","Amazon DynamoDB","Amazon Neptune"],answer:[3],is_multi:false},
{question:"Which AWS service provides machine learning capability to detect and analyze content in images and videos?",options:["Amazon Connect","Amazon Lightsail","Amazon Personalize","Amazon Rekognition"],answer:[3],is_multi:false},
{question:"A company wants its AWS usage to be more sustainable. The company wants to track, measure, review, and forecast polluting emissions that result from its AWS applications.\nWhich AWS service or tool can the company use to meet these requirements?",options:["AWS Health Dashboard","AWS customer carbon footprint tool","AWS Support Center","Amazon QuickSight"],answer:[1],is_multi:false},
{question:"Which AWS service gives users the ability to deploy highly repeatable infrastructure configurations?",options:["AWS CloudFormation","AWS CodeDeploy","AWS CodeBuild","AWS Systems Manager"],answer:[0],is_multi:false},
{question:"A company needs to provide customer service by using voice calls and web chat features.\nWhich AWS service should the company use to meet these requirements?",options:["Amazon Aurora","Amazon Connect","Amazon WorkSpaces","AWS Organizations"],answer:[1],is_multi:false},
{question:"Which AWS service is designed to help users handle large amounts of data in a data warehouse environment?",options:["Amazon RDS","Amazon DynamoDB","Amazon Redshift","Amazon Aurora"],answer:[2],is_multi:false},
{question:"A company is building a web application using AWS.\nWhich AWS service will help prevent network layer DDoS attacks against the web application?",options:["AWS WAF","AWS Firewall Manager","Amazon GuardDuty","AWS Shield"],answer:[3],is_multi:false},
{question:"Which of the following are advantages of moving to the AWS Cloud? (Choose two.)",options:["Users can implement all AWS services in seconds.","AWS assumes all responsibility for the security of infrastructure and applications.","Users experience increased speed and agility.","Users benefit from massive economies of scale.","Users can move hardware from their data center to the AWS Cloud."],answer:[2,3],is_multi:true},
{question:"Which AWS compute service gives users the ability to securely and reliably run containers at scale?",options:["Amazon Elastic Container Service (Amazon ECS)","Amazon Aurora","Amazon Athena","Amazon Polly"],answer:[0],is_multi:false},
{question:"Which AWS tool or feature acts as a VPC firewall at the subnet level?",options:["Security group","Network ACL","Traffic Mirroring","Internet gateway"],answer:[1],is_multi:false},
{question:"A company runs an application on AWS that performs batch jobs. The application is fault-tolerant and can handle interruptions. The company wants to optimize the cost to run the application.\nWhich AWS offering will meet these requirements?",options:["Amazon Macie","Amazon Neptune","Amazon EC2 Spot Instances","Amazon EC2 On-Demand Instances"],answer:[2],is_multi:false},
{question:"Which AWS service can be used to send alerts when a specific Amazon CloudWatch alarm is invoked?",options:["AWS CloudTrail","Amazon Simple Notification Service (Amazon SNS)","Amazon Simple Queue Service (Amazon SQS)","Amazon EventBridge"],answer:[1],is_multi:false},
{question:"A cloud practitioner wants to use a highly available and scalable DNS service for its AWS workload.\nWhich AWS service will meet this requirement?",options:["Amazon Route 53","Amazon Lightsail","AWS Amplify Hosting","Amazon S3"],answer:[0],is_multi:false},
{question:"According to the AWS shared responsibility model, which task is the customer's responsibility?",options:["Maintaining the infrastructure needed to run AWS Lambda","Updating the operating system of Amazon DynamoDB instances","Maintaining Amazon S3 infrastructure","Updating the guest operating system on Amazon EC2 instances"],answer:[3],is_multi:false},
{question:"A company is learning about its responsibilities that are related to the management of Amazon EC2 instances.\nWhich tasks for EC2 instances are the company's responsibility, according to the AWS shared responsibility model? (Choose two.)",options:["Install and patch the machine hypervisor.","Patch the guest operating system.","Encrypt data at rest on associated storage.","Install the physical hardware and cabling.","Provide physical security for the EC2 instances."],answer:[1,2],is_multi:true},
{question:"A company runs MySQL database workloads on self-managed servers in an on-premises data center. The company wants to migrate the database workloads to an AWS managed service.\nWhich migration strategy should the company use?",options:["Rehost","Repurchase","Refactor","Replatform"],answer:[3],is_multi:false},
{question:"A company is planning to migrate a monolithic application to AWS. The company wants to modernize the application by splitting it into microservices. The company will deploy the microservices on AWS.\nWhich migration strategy should the company use?",options:["Rehost","Repurchase","Replatform","Refactor"],answer:[3],is_multi:false},
{question:"A company wants to implement detailed tracking of its cloud costs by department and project.\nWhich AWS feature or service should the company use?",options:["Consolidated billing","Cost allocation tags","AWS Marketplace","AWS Budgets"],answer:[1],is_multi:false},
{question:"A user wants to invoke an AWS Lambda function when an Amazon EC2 instance enters the \"stopping\" state.\nWhich AWS service is appropriate for this use case?",options:["Amazon EventBridge","AWS Config","Amazon Simple Notification Service (Amazon SNS)","AWS CloudFormation"],answer:[0],is_multi:false},
{question:"A company has a MariaDB database on premises. The company wants to move the data to the AWS Cloud.\nWhich AWS service will host this database with the LEAST amount of operational overhead?",options:["Amazon RDS","Amazon Neptune","Amazon S3","Amazon DynamoDB"],answer:[0],is_multi:false},
{question:"Which AWS service or feature supports governance, compliance, and risk auditing of AWS accounts?",options:["Multi-factor authentication (MFA)","AWS Lambda","Amazon Simple Notification Service (Amazon SNS)","AWS CloudTrail"],answer:[3],is_multi:false},
{question:"Which AWS Cloud design principle is a company using when the company implements AWS CloudTrail?",options:["Activate traceability.","Use serverless compute architectures.","Perform operations as code.","Go global in minutes."],answer:[0],is_multi:false},
{question:"A company needs a threat detection service that will continuously monitor its AWS accounts, workloads, and Amazon S3 buckets for malicious activity and unauthorized behavior.\nWhich AWS service meets these requirements?",options:["AWS Shield","AWS Firewall Manager","Amazon GuardDuty","Amazon Inspector"],answer:[2],is_multi:false},
{question:"A company is planning to migrate to the AWS Cloud. The company is conducting organizational transformation and wants to become more responsive to customer inquiries and feedback.\nWhich task should the company perform to meet these requirements, according to the AWS Cloud Adoption Framework (AWS CAF)?",options:["Realign teams to focus on products and value streams.","Create new value propositions with new products and services.","Use a new data and analytics platform to create actionable insights.","Migrate and modernize legacy infrastructure."],answer:[0],is_multi:false},
{question:"A company wants to rightsize its Amazon EC2 instances.\nWhich configuration change will meet this requirement with the LEAST operational overhead?",options:["Add EC2 instances in another Availability Zone.","Change the size and type of the EC2 instances based on utilization.","Convert the payment method from On-Demand to Savings Plans.","Reprovision the EC2 instances with a larger instance type."],answer:[1],is_multi:false},
{question:"Which AWS service supports user sign-up functionality and authentication to mobile and web applications?",options:["Amazon Cognito","AWS Config","Amazon GuardDuty","AWS Systems Manager"],answer:[0],is_multi:false},
{question:"Which benefit of the AWS Cloud helps companies achieve lower usage costs because of the aggregate usage of all AWS users?",options:["No need to guess capacity","Ability to go global in minutes","Economies of scale","Increased speed and agility"],answer:[2],is_multi:false},
{question:"Which task is the responsibility of the customer, according to the AWS shared responsibility model?",options:["Patch the Amazon DynamoDB operating system.","Secure Amazon CloudFront edge locations by allowing physical access according to the principle of least privilege.","Protect the hardware that runs AWS services.","Use AWS Identity and Access Management (IAM) according to the principle of least privilege."],answer:[3],is_multi:false},
{question:"A company wants to manage its cloud resources by using infrastructure as code (IaC) templates. The company needs to meet compliance requirements.\nWhich AWS service should the company use to meet these requirements?",options:["AWS Artifact","AWS Resource Explorer","AWS License Manager","AWS Service Catalog"],answer:[3],is_multi:false},
{question:"A systems administrator wants to monitor the CPU utilization of a company's Amazon EC2 instances.\nWhich AWS service can provide this information?",options:["AWS Config","AWS Trusted Advisor","AWS CloudTrail","Amazon CloudWatch"],answer:[3],is_multi:false},
{question:"A company wants to migrate all of its on-premises infrastructure to the AWS Cloud. Before migration, the company wants estimate of costs for running its as-is infrastructure.\nWhich AWS service or principle should the company use to meet this requirement?",options:["AWS Pricing Calculator","AWS Well-Architected Framework","AWS shared responsibility model","AWS Cloud Adoption Framework (AWS CAF)"],answer:[0],is_multi:false},
{question:"An independent software vendor wants to deliver and share its custom Amazon Machine Images (AMIs) to prospective customers.\nWhich AWS service will meet these requirements?",options:["AWS Marketplace","AWS Data Exchange","Amazon EC2","AWS Organizations"],answer:[0],is_multi:false},
{question:"Which component must be attached to a VPC to enable inbound internet access?",options:["NAT gateway","VPC endpoint","VPN connection","Internet gateway"],answer:[3],is_multi:false},
{question:"Which AWS service supports a company's ability to treat infrastructure as code?",options:["AWS CodeDeploy","AWS Elastic Beanstalk","Amazon API Gateway","AWS CloudFormation"],answer:[3],is_multi:false},
{question:"A company is building an application that will receive millions of database queries each second. The company needs the data store for the application to scale to meet these needs.\nWhich AWS service will meet this requirement?",options:["Amazon DynamoDB","AWS Cloud9","Amazon ElastiCache for Memcached","Amazon Neptune"],answer:[0],is_multi:false},
{question:"An AWS user wants to proactively detect when an instance or account might be compromised or if there are threats from attacks.\nWhich AWS service should the user choose?",options:["Amazon GuardDuty","AWS WAF","AWS Shield","Amazon Inspector"],answer:[0],is_multi:false},
{question:"Which AWS Support plan provides the full set of AWS Trusted Advisor checks at the LOWEST cost?",options:["AWS Developer Support","AWS Business Support","AWS Enterprise On-Ramp Support","AWS Enterprise Support"],answer:[1],is_multi:false},
{question:"A company's application is running on Amazon EC2 instances. The company is planning a partial migration to a serverless architecture in the next year and wants to pay for resources up front.\nWhich AWS purchasing option will optimize the company's costs?",options:["Convertible Reserved Instances","Spot Instances","EC2 Instance Savings Plans","Compute Savings Plan"],answer:[3],is_multi:false},
{question:"A retail company is building a new mobile app. The company is evaluating whether to build the app at an on-premises data center or in the AWS Cloud.\nWhich of the following are benefits of building this app in the AWS Cloud? (Choose two.)",options:["A large, upfront capital expense and low variable expenses","Increased speed for trying out new projects","Complete control over the physical security of the infrastructure","Flexibility to scale up in minutes as the application becomes popular","Ability to pick the specific data centers that will host the application servers"],answer:[1,3],is_multi:true},
{question:"A company must archive its documents by using a write-once, read-many (WORM) model to meet legal and compliance obligations.\nWhich feature of Amazon S3 can the company use to meet this requirement?",options:["S3 Versioning","S3 bucket policy","S3 Glacier Vault Lock","S3 multi-factor authentication (MFA) delete"],answer:[2],is_multi:false},
{question:"A company has batch workloads that need to run for short periods of time on Amazon EC2. The workloads can handle interruptions and can start again from where they ended.\nWhat is the MOST cost-effective EC2 instance purchasing option to meet these requirements?",options:["Reserved Instances","Spot Instances","Dedicated Instances","On-Demand Instances"],answer:[1],is_multi:false},
{question:"A company needs to deploy a PostgreSQL database into Amazon RDS. The database must be highly available and fault tolerant.\nWhich AWS solution should the company use to meet these requirements?",options:["Amazon RDS with a single Availability Zone","Amazon RDS snapshots","Amazon RDS with multiple Availability Zones","AWS Database Migration Service (AWS DMS)"],answer:[2],is_multi:false},
{question:"What is the MOST secure way to store passwords on AWS?",options:["Store passwords in an Amazon S3 bucket.","Store passwords as AWS CloudFormation parameters.","Store passwords in AWS Storage Gateway.","Store passwords in AWS Secrets Manager."],answer:[3],is_multi:false},
{question:"Which statements accurately describe the relationships among components of AWS global infrastructure? (Choose two.)",options:["There are more AWS Regions than Availability Zones.","There are more edge locations than AWS Regions.","An edge location is an Availability Zone.","There are more AWS Regions than edge locations.","There are more Availability Zones than AWS Regions."],answer:[1,4],is_multi:true},
{question:"Which AWS service provides DNS resolution?",options:["Amazon CloudFront","Amazon VPC","Amazon Route 53","AWS Direct Connect"],answer:[2],is_multi:false},
{question:"A company needs to host an application in a specific geographic area to comply with regulations.\nWhich feature of the AWS global infrastructure will help the company meet this requirement?",options:["Scalability","Global footprint","Availability","Performance"],answer:[1],is_multi:false},
{question:"An ecommerce company plans to move its data center workload to the AWS Cloud to support highly dynamic usage patterns.\nWhich benefits make the AWS Cloud cost-effective for the migration of this type of workload? (Choose two.)",options:["Reliability","Security","Elasticity","Pay-as-you-go resource","High availability"],answer:[2,3],is_multi:true},
{question:"When designing AWS workloads to be operational even when there are component failures, what is an AWS best practice?",options:["Perform quarterly disaster recovery tests.","Place the main component on the us-east-1 Region.","Design for automatic failover to healthy resources.","Design workloads to fit on a single Amazon EC2 instance."],answer:[2],is_multi:false},
{question:"Which of the following can the AWS Pricing Calculator do?",options:["Project monthly AWS costs.","Calculate historical AWS costs.","Provide in-depth information about AWS pricing strategies.","Provide users with access to their monthly bills."],answer:[0],is_multi:false},
{question:"Which AWS solution gives companies the ability to use protocols such as NFS to store and retrieve objects in Amazon S3?",options:["Amazon FSx for Lustre","AWS Storage Gateway volume gateway","AWS Storage Gateway file gateway","Amazon Elastic File System (Amazon EFS)"],answer:[2],is_multi:false},
{question:"A user has been granted permission to change their own IAM user password.\nWhich AWS services can the user use to change the password? (Choose two.)",options:["AWS Command Line Interface (AWS CLI)","AWS Key Management Service (AWS KMS)","AWS Management Console","AWS Resource Access Manager (AWS RAM)","AWS Secrets Manager"],answer:[0,2],is_multi:true},
{question:"Which task is the customer's responsibility, according to the AWS shared responsibility model?",options:["Patch a guest operating system that is deployed on an Amazon EC2 instance.","Control physical access to an AWS data center.","Control access to AWS underlying hardware.","Patch a host operating system that is deployed on Amazon S3."],answer:[0],is_multi:false},
{question:"Which AWS service or feature provides a firewall at the subnet level within a VPC?",options:["Security group","Network ACL","Elastic network interface","AWS WAF"],answer:[1],is_multi:false},
{question:"A company wants to use automated video analysis to identify employees that are accessing its offices.\nWhich AWS service will meet this requirement?",options:["Amazon Rekognition","Amazon Polly","Amazon Cognito","AWS Lambda"],answer:[0],is_multi:false},
{question:"A company needs to host a web server on Amazon EC2 instances for at least 1 year. The web server cannot tolerate interruption.\nWhich EC2 instance purchasing option will meet these requirements MOST cost-effectively?",options:["On-Demand Instances","Partial Upfront Reserved Instances","Spot Instances","No Upfront Reserved Instances"],answer:[1],is_multi:false},
{question:"Which guidelines are best practices for using AWS Identity and Access Management (IAM)? (Choose two.)",options:["Share access keys.","Create individual IAM users.","Use inline policies instead of customer managed policies.","Grant maximum privileges to IAM users.","Use groups to assign permissions to IAM users."],answer:[1,4],is_multi:true},
{question:"Which advantage of cloud computing allows users to scale resources up and down based on the amount of load that an application supports?",options:["Go global in minutes","Stop guessing capacity","Benefit from massive economies of scale","Trade fixed expense for variable expense"],answer:[1],is_multi:false},
{question:"A company is requesting Payment Card Industry (PCI) reports that validate the operating effectiveness of AWS security controls.\nHow should the company obtain these reports?",options:["Contact AWS Support.","Download reports from AWS Artifact.","Download reports from AWS Security Hub.","Contact an AWS technical account manager (TAM)."],answer:[1],is_multi:false},
{question:"An ecommerce company wants to distribute traffic between the Amazon EC2 instances that host its website.\nWhich AWS service or resource will meet these requirements?",options:["Application Load Balancer","AWS WAF","AWS CloudHSM","AWS Direct Connect"],answer:[0],is_multi:false},
{question:"Which AWS services or features form the AWS Cloud global infrastructure? (Choose two.)",options:["Availability Zones","Amazon ElastiCache","AWS Regions","Amazon S3","Amazon VPC"],answer:[0,2],is_multi:true},
{question:"According to the AWS shared responsibility model, which of the following are AWS responsibilities? (Choose two.)",options:["Network infrastructure and virtualization of infrastructure","Security of application data","Guest operating systems","Physical security of hardware","Credentials and policies"],answer:[0,3],is_multi:true},
{question:"A company uses Amazon Aurora as its database service. The company wants to encrypt its databases and database backups.\nWhich party manages the encryption of the database clusters and database snapshots, according to the AWS shared responsibility model?",options:["AWS","The company","AWS Marketplace partners","Third-party partners"],answer:[1],is_multi:false},
{question:"A company is hosting a web application on Amazon EC2 instances. The company wants to implement custom conditions to filter and control inbound web traffic.\nWhich AWS service will meet these requirements?",options:["Amazon GuardDuty","AWS WAF","Amazon Macie","AWS Shield"],answer:[1],is_multi:false},
{question:"A company wants to maintain bandwidth throughput and provide a more consistent network experience than public internet-based connections.\nWhich AWS service should the company choose?",options:["AWS VPN","AWS Direct Connect","Amazon Connect","Amazon CloudFront"],answer:[3],is_multi:false},
{question:"A company has temporary workload that is also variable. The company needs to use Amazon EC2 instances for the workload. The EC2 instances need to handle short bursts of work that cannot stop before finishing.\nWhich purchase option will meet these requirements?",options:["Spot Instances","On-Demand Instances","Savings Plan","Reserved Instances"],answer:[1],is_multi:false},
{question:"A company's employees are working from home. The company wants its employees to use their personal devices to connect to a managed workstation in the AWS Cloud.\nWhich AWS service should the company use to provide the remote environment?",options:["Amazon Workspaces","AWS Cloud9","AWS Outposts","Amazon Lightsail"],answer:[0],is_multi:false},
{question:"A company needs to use SQL syntax to perform a direct query of objects in an Amazon S3 bucket.\nWhich AWS service can the company use to meet this requirement?",options:["AWS Glue","Amazon Athena","AWS Lambda","Amazon Kinesis"],answer:[1],is_multi:false},
{question:"A company uses Amazon RDS for a product database. The company wants to ensure the database is highly available.\nWhich feature of Amazon RDS will meet this requirement?",options:["Read replicas","Blue/green deployment","Multi-AZ deployment","Reserved Instances"],answer:[2],is_multi:false},
{question:"Which AWS service provides serverless compute for use with containers?",options:["Amazon Simple Queue Service (Amazon SQS)","AWS Fargate","AWS Elastic Beanstalk","Amazon SageMaker"],answer:[1],is_multi:false},
{question:"A company is using multiple AWS accounts for different business teams. The finance team wants to receive one bill for all of the company's accounts.\nWhich AWS service or tool should the finance team use to meet this requirement?",options:["AWS Organizations","AWS Trusted Advisor","Cost Explorer","AWS Budgets"],answer:[0],is_multi:false},
{question:"A company needs a firewall that will control network connections to and from a single Amazon EC2 instance. This firewall will not control network connections to and from other instances that are in the same subnet.\nWhich AWS service or feature can the company use to meet these requirements?",options:["Network ACL","AWS WAF","Route table","Security group"],answer:[3],is_multi:false},
{question:"A company is planning to use the Amazon EC2 instances as web servers. Customers from around the world will use the web servers. Most customers will use the web servers only during certain hours of the day.\nHow should the company deploy the EC2 instances to achieve the LOWEST operational cost?",options:["In multiple Availability Zones","In an Auto Scaling group","In a placement group","In private subnets"],answer:[1],is_multi:false},
{question:"Which benefit is always free of charge with AWS, regardless of a user's AWS Support plan?",options:["AWS Developer Support","AWS Developer Forums","Programmatic case management","AWS technical account manager (TAM)"],answer:[1],is_multi:false},
{question:"A company uses Amazon EC2 instances to run its application. The application needs to be available and running continuously for three or more years.\nWhat type of EC2 instance should the company purchase for a discount on the EC2 pricing?",options:["Reserved Instances","Spot Instances","On-Demand Instances","EC2 Fleet"],answer:[0],is_multi:false},
{question:"A company needs to perform an audit of recent AWS account activity. The audit will investigate who initiated an event and what actions were performed.\nWhich AWS service should the company use to meet these requirements?",options:["AWS Config","Amazon Rekognition","AWS CloudTrail","Amazon Simple Notification Service (Amazon SNS)"],answer:[2],is_multi:false},
{question:"Which design principles are included in the reliability pillar of the AWS Well-Architected Framework? (Choose two.)",options:["Automatically recover from failure.","Grant everyone access to increase AWS service quotas.","Stop guessing capacity.","Design applications to run in a single Availability Zone.","Plan to increase AWS service quotas first in a secondary AWS Region."],answer:[0,2],is_multi:true},
{question:"A company needs to use AWS technology to deploy a static website.\nWhich solution meets this requirement with the LEAST amount of operational overhead?",options:["Deploy the website on Amazon EC2.","Host the website on AWS Elastic Beanstalk.","Deploy the website with Amazon Lightsail.","Host the website on Amazon S3."],answer:[3],is_multi:false},
{question:"Which recommendation can AWS Cost Explorer provide to help reduce cost?",options:["Use a specific database engine.","Change the programming language for an application.","Deploy a specific operating system.","Terminate an idle instance."],answer:[3],is_multi:false},
{question:"A company wants to deploy an application in multiple Availability Zones in a single AWS Region.\nWhich benefit will this deployment provide to the company?",options:["Improved connection performance for global customers","Resilient architecture and a highly available solution","Reduced overall data storage costs","Ability to shut down an Availability Zone during periods of low demand"],answer:[1],is_multi:false},
{question:"Which AWS service can companies use to subscribe to RSS feeds for updates about all AWS service issues?",options:["Amazon Simple Notification Service (Amazon SNS)","AWS Health Dashboard","AWS Config","AWS CodeCommit"],answer:[1],is_multi:false},
{question:"Which Amazon EC2 Reserved Instances term commitment will give users the MOST cost savings?",options:["1 year","2 years","3 years","5 years"],answer:[2],is_multi:false},
{question:"A company is running big data analytics and massive parallel computations on its AWS test and development servers. The company can tolerate occasional downtime.\nWhat is the MOST cost-effective Amazon EC2 purchasing option for the company to use?",options:["On-Demand Instances","Spot Instances","Reserved Instances","Savings Plans"],answer:[1],is_multi:false},
{question:"A company runs Amazon EC2 instances in a research lab. The instances run for 3 hours each week and cannot be interrupted.\nWhat is the MOST cost-effective instance purchasing option to meet these requirements?",options:["Compute Savings Plan","On-Demand Instances","Convertible Reserved Instances","Spot Instances"],answer:[3],is_multi:false},
{question:"A new AWS user needs to interact with AWS Support by using API calls.\nWhich AWS Support plan will meet this requirement MOST cost-effectively?",options:["AWS Basic Support","AWS Developer Support","AWS Business Support","AWS Enterprise Support"],answer:[1],is_multi:false},
{question:"A company migrated to the AWS Cloud. Now the company pays for services on an as-needed basis.\nWhich advantage of cloud computing is the company benefiting from?",options:["Stop spending money running and maintaining data centers","Increase speed and agility","Go global in minutes","Trade fixed expense for variable expense"],answer:[3],is_multi:false},
{question:"A company will run a predictable compute workload on Amazon EC2 instances for the next 3 years. The workload is critical for the company. The company wants to optimize costs to run the workload.\nWhich solution will meet these requirements?",options:["Spot Instances","Dedicated Hosts","Savings Plans","On-Demand Instances"],answer:[2],is_multi:false},
{question:"A company wants to estimate the cost for its AWS architecture solution before migration.\nWhich AWS service or feature will meet this requirement?",options:["Amazon Detective","AWS Budgets","AWS Resource Explorer","AWS Pricing Calculator"],answer:[3],is_multi:false},
{question:"A company wants to centrally manage its employee's access to multiple AWS accounts.\nWhich AWS service or feature should the company use to meet this requirement?",options:["AWS Identity and Access Management Access Analyzer","AWS Secrets Manager","AWS IAM Identity Center","AWS Security Token Service (AWS STS)"],answer:[2],is_multi:false},
{question:"A university receives a grant to conduct research by using AWS services. The research team needs to make sure the grant money lasts for the entire school year. The team has decided on a monthly allocation that adds up to the total grant amount.\nWhich AWS service or feature will notify the team if spending exceeds the planned amount?",options:["AWS Budgets","Cost Explorer","Cost allocation tags","Cost categories"],answer:[0],is_multi:false},
{question:"A company has migrated its workload to the AWS Cloud. The company wants to optimize existing Amazon EC2 resources.\nWhich AWS services or tools provide this functionality? (Choose two.)",options:["AWS Elastic Beanstalk","AWS Cost Explorer","Amazon Detective","AWS Compute Optimizer","AWS Billing Conductor"],answer:[1,3],is_multi:true},
{question:"A company with multiple accounts and teams wants to set up a new multi-account AWS environment.\nWhich AWS service supports this requirement?",options:["AWS CloudFormation","AWS Control Tower","AWS Config","Amazon Virtual Private Cloud (Amazon VPC)"],answer:[1],is_multi:false},
{question:"A company needs access to checks and recommendations that help the company follow AWS best practices for cost optimization, security, fault tolerance, performance, and service quotas.\nWhich combination of an AWS service and AWS Support plan on the AWS account will meet these requirements?",options:["AWS Trusted Advisor with AWS Developer Support","AWS Health Dashboard with AWS Enterprise Support","AWS Trusted Advisor with AWS Business Support","AWS Health Dashboard with AWS Enterprise On-Ramp Support"],answer:[2],is_multi:false},
{question:"Which AWS service helps users plan and track their server and application inventory migration data to AWS?",options:["Amazon CloudWatch","AWS DataSync","AWS Migration Hub","AWS Application Migration Service"],answer:[2],is_multi:false},
{question:"Which AWS team or offering helps users accelerate cloud adoption through paid engagements in any of several specialty practice areas?",options:["AWS Enterprise Support","AWS solutions architects","AWS Professional Services","AWS account managers"],answer:[2],is_multi:false},
{question:"A company needs to purchase Amazon EC2 instances to support an application that will run continuously for more than 1 year.\nWhich EC2 instance purchasing option meets these requirements MOST cost-effectively?",options:["Dedicated Instances","Spot Instances","Reserved Instances","On-Demand Instances"],answer:[2],is_multi:false},
{question:"Which programming languages does AWS Cloud Development Kit (AWS CDK) currently support? (Choose two.)",options:["Python","Swift","TypeScript","Ruby","PHP"],answer:[0,2],is_multi:true},
{question:"Which AWS service or feature gives users the ability to provision AWS infrastructure programmatically?",options:["AWS Cloud Development Kit (AWS CDK)","Amazon CodeGuru","AWS Config","AWS CodeCommit"],answer:[0],is_multi:false},
{question:"Which AWS service or feature allows a company to have its own logically isolated section of the AWS Cloud?",options:["AWS VPN","Availability Zones","Amazon Virtual Private Cloud (Amazon VPC)","AWS Regions"],answer:[2],is_multi:false},
{question:"Which of the following actions are controlled with AWS Identity and Access Management (IAM)? (Choose two.)",options:["Control access to AWS service APIs and to other specific resources.","Provide intelligent threat detection and continuous monitoring.","Protect the AWS environment using multi-factor authentication (MFA).","Grant users access to AWS data centers.","Provide firewall protection for applications from common web attacks."],answer:[0,2],is_multi:true},
{question:"Why are AWS CloudFormation templates used?",options:["To reduce provisioning time by using automation.","To transfer existing infrastructure to another company.","To reuse on-premises infrastructure in the AWS Cloud.","To deploy large infrastructure with no cost implications."],answer:[0],is_multi:false},
{question:"A company is using AWS Identity and Access Management (IAM).\nWho can manage the access keys of the AWS account root user?",options:["IAM users in the same account that have been granted permission","IAM roles in any account that have been granted permission","IAM users and roles that have been granted permission","The AWS account owner"],answer:[3],is_multi:false},
{question:"Which group shares responsibility with AWS for security and compliance of AWS accounts and resources?",options:["Third-party vendors","Customers","Reseller partners","Internet providers"],answer:[1],is_multi:false},
{question:"A company needs an event history of which AWS resources the company has created.\nWhich AWS service will provide this information?",options:["Amazon CloudWatch","AWS CloudTrail","Amazon Aurora","Amazon EventBridge"],answer:[1],is_multi:false},
{question:"A company wants to run relationship databases in the AWS Cloud. The company wants to use a managed service that will install the database and run regular software updates.\nWhich AWS service will meet these requirements?",options:["Amazon S3","Amazon RDS","Amazon Elastic Block Store (Amazon EBS)","Amazon DynamoDB"],answer:[1],is_multi:false},
{question:"Which AWS service provides a fully managed graph database for highly connected datasets?",options:["Amazon DynamoDB","Amazon RDS","Amazon Neptune","Amazon Aurora"],answer:[2],is_multi:false},
{question:"A company's cloud environment includes Amazon EC2 instances and Application Load Balancers. The company wants to improve protections for its cloud resources against DDoS attacks. The company also wants to have real-time visibility into any DDoS attacks.\nWhich AWS service will meet these requirements?",options:["AWS Shield Standard","AWS Firewall Manager","AWS Shield Advanced","Amazon GuardDuty"],answer:[2],is_multi:false},
{question:"A company wants to update its online data processing application by implementing container-based services that run for 4 hours at a time. The company does not want to provision or manage server instances.\nWhich AWS service will meet these requirements?",options:["AWS Lambda","AWS Fargate","Amazon EC2","AWS Elastic Beanstalk"],answer:[1],is_multi:false},
{question:"Which AWS service enables users to create copies of resources across AWS Regions?",options:["Amazon ElastiCache","AWS CloudFormation","AWS CloudTrail","AWS Systems Manager"],answer:[1],is_multi:false},
{question:"Which task is the responsibility of AWS, according to the AWS shared responsibility model?",options:["Apply guest operating system patches to Amazon EC2 instances.","Provide monitoring of human resources information management (HRIM) systems.","Perform automated backups of Amazon RDS instances.","Optimize the costs of running AWS services."],answer:[2],is_multi:false},
{question:"A user needs to perform a one-time backup of an Amazon Elastic Block Store (Amazon EBS) volume that is attached to an Amazon EC2 instance.\nWhat is the MOST operationally efficient way to perform this backup?",options:["Attach another EBS volume to the EC2 instance, and copy the contents.","Copy the EBS volume to a server that is running outside AWS and is connected with AWS Direct Connect.","Create an EBS snapshot of the volume.","Create a custom script to copy the EBS file contents to Amazon S3."],answer:[2],is_multi:false},
{question:"A developer who has no AWS Cloud experience wants to use AWS technology to build a web application.\nWhich AWS service should the developer use to start building the application?",options:["Amazon SageMaker","AWS Lambda","Amazon Lightsail","Amazon Elastic Container Service (Amazon ECS)"],answer:[2],is_multi:false},
{question:"A company wants to manage access and permissions for its third-party software as a service (SaaS) applications. The company wants to use a portal where end users can access assigned AWS accounts and AWS Cloud applications.\nWhich AWS service should the company use to meet these requirements?",options:["Amazon Cognito","AWS IAM Identity Center (AWS Single Sign-On)","AWS Identity and Access Management (IAM)","AWS Directory Service for Microsoft Active Directory"],answer:[1],is_multi:false},
{question:"Which AWS service is designed for users running workloads that include a NoSQL database?",options:["Amazon RDS","Amazon S3","Amazon Redshift","Amazon DynamoDB"],answer:[3],is_multi:false},
{question:"A company has a website on AWS. The company wants to deliver the website to a worldwide audience and provide low-latency response times for global users.\nWhich AWS service will meet these requirements?",options:["AWS CloudFormation","Amazon CloudFront","Amazon ElastiCache","Amazon DynamoDB"],answer:[1],is_multi:false},
{question:"A company wants to add a conversational chatbot to its website.\nWhich AWS service can the company use to meet this requirement?",options:["Amazon Textract","Amazon Lex","AWS Glue","Amazon Rekognition"],answer:[1],is_multi:false},
{question:"Which AWS service or feature can be used to monitor for potential disk write spikes on a system that is running on Amazon EC2?",options:["AWS CloudTrail","AWS Health Dashboard","AWS Trusted Advisor","Amazon CloudWatch"],answer:[3],is_multi:false},
{question:"A company has applications that control on-premises factory equipment.\nWhich AWS service should the company use to run these applications with the LEAST latency?",options:["AWS Outposts","Amazon EC2","AWS Lambda","AWS Fargate"],answer:[0],is_multi:false},
{question:"Which AWS Cloud Adoption Framework (AWS CAF) perspective focuses on organizing an inventory of data products in a data catalog?",options:["Operations","Governance","Business","Platform"],answer:[1],is_multi:false},
{question:"A company runs its production workload in the AWS Cloud. The company needs to choose one of the AWS Support Plans.\nWhich of the AWS Support Plans will meet these requirements at the LOWEST cost?",options:["Developer","Enterprise On-Ramp","Enterprise","Business"],answer:[3],is_multi:false},
{question:"What is the primary use case for Amazon GuardDuty?",options:["Prevention of DDoS attacks","Protection against SQL injection attacks","Automatic monitoring for threats to AWS workloads","Automatic provisioning of AWS resources"],answer:[2],is_multi:false},
{question:"Which VPC component can a company use to set up a virtual firewall at the Amazon EC2 instance level?",options:["Network ACL","Security group","Route table","NAT gateway"],answer:[1],is_multi:false},
{question:"A developer needs to interact with AWS by using the AWS CLI.\nWhich security feature or AWS service must be provisioned in the developer's account to meet this requirement?",options:["User name and password","AWS Systems Manager","Root password access","AWS access key"],answer:[3],is_multi:false},
{question:"A food delivery company needs to block users in certain countries from accessing its website.\nWhich AWS service should the company use to meet this requirement?",options:["AWS WAF","AWS Control Tower","Amazon Fraud Detector","Amazon Pinpoint"],answer:[0],is_multi:false},
{question:"A company needs to use Amazon S3 to store audio files that are each 5 megabytes in size. The company will rarely access the files, but the company must be able to retrieve the files immediately.\nWhich S3 storage class will meet these requirements MOST cost-effectively?",options:["S3 Standard","S3 Standard-Infrequent Access (S3 Standard-IA)","S3 Glacier Flexible Retrieval","S3 Glacier Deep Archive"],answer:[1],is_multi:false},
{question:"A company wants to set up a secure network connection from on premises to the AWS Cloud within 1 week.\nWhich solution will meet these requirements?",options:["AWS Direct Connect","Amazon VPC","AWS Site-to-Site VPN","Edge location"],answer:[2],is_multi:false},
{question:"What is a customer responsibility under the AWS shared responsibility model when using AWS Lambda?",options:["Maintenance of the underlying Lambda hardware.","Maintenance of the Lambda networking infrastructure.","The code and libraries that run in the Lambda functions.","The Lambda server software."],answer:[2],is_multi:false},
{question:"Which tasks are the responsibility of AWS according to the AWS shared responsibility model? (Choose two.)",options:["Configure AWS Identity and Access Management (IAM).","Configure security groups on Amazon EC2 instances.","Secure the access of physical AWS facilities.","Patch applications that run on Amazon EC2 instances.","Perform infrastructure patching and maintenance."],answer:[2,4],is_multi:true},
{question:"A company's compliance officer wants to review the AWS Service Organization Control (SOC) reports.\nWhich AWS service or feature should the compliance officer use to complete this task?",options:["AWS Artifact","AWS Concierge Support","AWS Support","AWS Trusted Advisor"],answer:[0],is_multi:false},
{question:"A company has a compliance requirement to record and evaluate configuration changes, as well as perform remediation actions on AWS resources.\nWhich AWS service should the company use?",options:["AWS Config","AWS Secrets Manager","AWS CloudTrail","AWS Trusted Advisor"],answer:[0],is_multi:false},
{question:"A company plans to perform a one-time migration of a large dataset with millions of files from its on-premises data center to the AWS Cloud.\nWhich AWS service should the company use for the migration?",options:["AWS Database Migration Service (AWS DMS)","AWS DataSync","AWS Migration Hub","AWS Application Migration Service"],answer:[1],is_multi:false},
{question:"Which AWS network services or features allow CIDR block notation when providing an IP address range? (Choose two.)",options:["Security groups","Amazon Machine Image (AMI)","Network access control list (network ACL)","AWS Budgets","Amazon Elastic Block Store (Amazon EBS)"],answer:[0,2],is_multi:true},
{question:"A company wants to develop an accessibility application that will convert text into audible speech.\nWhich AWS service will meet this requirement?",options:["Amazon MQ","Amazon Polly","Amazon Neptune","Amazon Timestream"],answer:[1],is_multi:false},
{question:"A company needs to set up dedicated network connectivity between its on-premises data center and the AWS Cloud. The network cannot use the public internet.\nWhich AWS service or feature will meet these requirements?",options:["AWS Transit Gateway","AWS VPN","Amazon CloudFront","AWS Direct Connect"],answer:[3],is_multi:false},
{question:"A company needs to use dashboards and charts to analyze insights from business data.\nWhich AWS service will provide the dashboards and charts for these insights?",options:["Amazon Macie","Amazon Aurora","Amazon QuickSight","AWS CloudTrail"],answer:[2],is_multi:false},
{question:"A company wants to migrate its on-premises infrastructure to the AWS Cloud.\nWhich advantage of cloud computing will help the company reduce upfront costs?",options:["Go global in minutes","Increase speed and agility","Benefit from massive economies of scale","Trade fixed expense for variable expense"],answer:[3],is_multi:false},
{question:"A company is designing workloads in the AWS Cloud. The company wants the workloads to perform their intended function correctly and consistently throughout their lifecycle.\nWhich pillar of the AWS Well-Architected Framework does this goal represent?",options:["Operational excellence","Security","Reliability","Performance efficiency"],answer:[2],is_multi:false},
{question:"Which AWS service is used to temporarily provide federated security credentials to access AWS resources?",options:["Amazon GuardDuty","AWS Simple Token Service (AWS STS)","AWS Secrets Manager","AWS Certificate Manager"],answer:[1],is_multi:false},
{question:"What is a benefit of using an Elastic Load Balancing (ELB) load balancer with applications running in the AWS Cloud?",options:["An ELB will automatically scale resources to meet capacity needs.","An ELB can balance traffic across multiple compute resources.","An ELB can span multiple AWS Regions.","An ELB can balance traffic between multiple internet gateways."],answer:[1],is_multi:false},
{question:"A company needs to convert video files and audio files to a format that will play on smartphones.\nWhich AWS service will meet this requirement?",options:["Amazon Comprehend","Amazon Rekognition","Amazon Elastic Transcoder","Amazon Polly"],answer:[2],is_multi:false},
{question:"A company wants to securely store Amazon RDS database credentials and automatically rotate user passwords periodically.\nWhich AWS service or capability will meet these requirements?",options:["Amazon S3","AWS Systems Manager Parameter Store","AWS Secrets Manager","AWS CloudTrail"],answer:[2],is_multi:false},
{question:"A company needs to have the ability to set up infrastructure for new applications in minutes.\nWhich advantage of cloud computing will help the company meet this requirement?",options:["Trade fixed expense for variable expense","Go global in minutes","Increase speed and agility","Stop guessing capacity"],answer:[2],is_multi:false},
{question:"A company needs a managed NFS file system that the company can use with its AWS compute resources.\nWhich AWS service or feature will meet these requirements?",options:["Amazon Elastic Block Store (Amazon EBS)","AWS Storage Gateway Tape Gateway","Amazon S3 Glacier Flexible Retrieval","Amazon Elastic File System (Amazon EFS)"],answer:[3],is_multi:false},
{question:"A company plans to migrate to the AWS Cloud. The company wants to gather information about its on-premises data center.\nWhich AWS service should the company use to meet these requirements?",options:["AWS Application Discovery Service","AWS DataSync","AWS Storage Gateway","AWS Database Migration Service (AWS DMS)"],answer:[0],is_multi:false},
{question:"Which tasks are responsibilities of the customer, according to the AWS shared responsibility model? (Choose two.)",options:["Secure the virtualization layer.","Encrypt data and maintain data integrity.","Patch the Amazon RDS operating system.","Maintain identity and access management controls.","Secure Availability Zones."],answer:[1,3],is_multi:true},
{question:"An online retail company wants to migrate its on-premises workload to AWS. The company needs to automatically handle a seasonal workload increase in a cost-effective manner.\nWhich AWS Cloud features will help the company meet this requirement? (Choose two.)",options:["Cross-Region workload deployment","Pay-as-you-go pricing","Built-in AWS CloudTrail audit capabilities","Auto Scaling policies","Centralized logging"],answer:[1,3],is_multi:true},
{question:"A developer needs to use a standardized template to create copies of a company's AWS architecture for development, test, and production environments.\nWhich AWS service should the developer use to meet this requirement?",options:["AWS Cloud Map","AWS CloudFormation","Amazon CloudFront","AWS CloudTrail"],answer:[1],is_multi:false},
{question:"Which AWS service can create a private network connection from on premises to the AWS Cloud?",options:["AWS Config","Virtual Private Cloud (Amazon VPC)","AWS Direct Connect","Amazon Route 53"],answer:[2],is_multi:false},
{question:"Under the AWS shared responsibility model, which of the following is a responsibility of the customer?",options:["Shred disk drives before they leave a data center.","Prevent customers from gathering packets or collecting traffic at the hypervisor level.","Patch the guest operating system with the latest security patches.","Maintain security systems that provide physical monitoring of data centers."],answer:[2],is_multi:false},
{question:"Which AWS service uses speech-to-text conversion to help users create meeting notes?",options:["Amazon Polly","Amazon Textract","Amazon Rekognition","Amazon Transcribe"],answer:[3],is_multi:false},
{question:"Which AWS service or tool provides users with a graphical interface that they can use to manage AWS services?",options:["AWS Copilot","AWS CLI","AWS Management Console","AWS software development kits (SDKs)"],answer:[2],is_multi:false},
{question:"A company has a workload that will run continuously for 1 year. The workload cannot tolerate service interruptions.\nWhich Amazon EC2 purchasing option will be MOST cost-effective?",options:["All Upfront Reserved Instances","Partial Upfront Reserved Instances","Dedicated Instances","On-Demand Instances"],answer:[0],is_multi:false},
{question:"A company migrated its systems to the AWS Cloud. The systems are rightsized, and a security review did not reveal any issues. The company must ensure that additional developments, integrations, changes, and system usage growth do not jeopardize this optimized AWS infrastructure.\nWhich AWS service should the company use to report ongoing optimization and security?",options:["AWS Trusted Advisor","AWS Health Dashboard","Amazon Connect","AWS Systems Manager"],answer:[0],is_multi:false},
{question:"Which AWS service integrates with other AWS services to provide the ability to encrypt data at rest?",options:["AWS Key Management Service (AWS KMS)","AWS Certificate Manager (ACM)","AWS Identity and Access Management (IAM)","AWS Security Hub"],answer:[0],is_multi:false},
{question:"A company wants to track the monthly cost and usage of all Amazon EC2 instances in a specific AWS environment.\nWhich AWS service or tool will meet these requirements?",options:["AWS Cost Anomaly Detection","AWS Budgets","AWS Compute Optimizer","AWS Trusted Advisor"],answer:[1],is_multi:false},
{question:"A company wants the ability to automatically acquire resources as needed and release the resources when they are no longer needed.\nWhich cloud concept describes this functionality?",options:["Availability","Elasticity","Durability","Reliability"],answer:[1],is_multi:false},
{question:"A company wants a cost-effective option when running its applications in an Amazon EC2 instance for short time periods. The applications can be interrupted.\nWhich EC2 instance type will meet these requirements?",options:["Spot Instances","On-Demand Instances","Reserved Instances","Dedicated Instances"],answer:[0],is_multi:false},
{question:"A company has an AWS Business Support plan. The company needs to gain access to the AWS DDoS Response Team (DRT) to help mitigate DDoS events.\nWhich AWS service or resource must the company use to meet these requirements?",options:["AWS Shield Standard","AWS Enterprise Support","AWS WAF","AWS Shield Advanced"],answer:[3],is_multi:false},
{question:"Which AWS service or tool provides a visualization of historical AWS spending patterns and projections of future AWS costs?",options:["AWS Cost and Usage Report","AWS Budgets","Cost Explorer","Amazon CloudWatch"],answer:[2],is_multi:false},
{question:"A company is migrating to the AWS Cloud instead of running its infrastructure on premises.\nWhich of the following are advantages of this migration? (Choose two.)",options:["Elimination of the need to perform security auditing","Increased global reach and agility","Ability to deploy globally in minutes","Elimination of the cost of IT staff members","Redundancy by default for all compute services"],answer:[1,2],is_multi:true},
{question:"Which AWS service uses edge locations to cache content?",options:["Amazon Kinesis","Amazon Simple Queue Service (Amazon SQS)","Amazon CloudFront","Amazon Route 53"],answer:[2],is_multi:false},
{question:"A company wants to securely access an Amazon S3 bucket from an Amazon EC2 instance without accessing the internet.\nWhat should the company use to accomplish this goal?",options:["VPN connection","Internet gateway","VPC endpoint","NAT gateway"],answer:[2],is_multi:false},
{question:"A company wants an AWS service that can automate software deployment in Amazon EC2 instances and on-premises instances.\nWhich AWS service will meet this requirement?",options:["AWS CodeCommit","AWS CodeBuild","AWS CodeDeploy","AWS CodePipeline"],answer:[2],is_multi:false},
{question:"Which AWS services are serverless? (Choose two.)",options:["AWS Fargate","Amazon Managed Streaming for Apache Kafka","Amazon EMR","Amazon S3","Amazon EC2"],answer:[0,3],is_multi:true},
{question:"A company wants to continuously improve processes and procedures to deliver business value.\nWhich pillar of the AWS Well-Architected Framework does this goal represent?",options:["Performance efficiency","Operational excellence","Reliability","Sustainability"],answer:[1],is_multi:false},
{question:"Which of the following is a customer responsibility according to the AWS shared responsibility model?",options:["Apply security patches for Amazon S3 infrastructure devices.","Provide physical security for AWS datacenters.","Install operating system updates on Lambda@Edge.","Implement multi-factor authentication (MFA) for IAM user accounts."],answer:[3],is_multi:false},
{question:"Which AWS service should a company use to organize, characterize, and search large numbers of images?",options:["Amazon Transcribe","Amazon Rekognition","Amazon Aurora","Amazon QuickSight"],answer:[1],is_multi:false},
{question:"Which AWS service is always available free of charge to users?",options:["Amazon Athena","AWS Identity and Access Management (IAM)","AWS Secrets Manager","Amazon ElastiCache"],answer:[1],is_multi:false},
{question:"A company needs to run some of its workloads on premises to comply with regulatory guidelines. The company wants to use the AWS Cloud to run workloads that are not required to be on premises. The company also wants to be able to use the same API calls for the on-premises workloads and the cloud workloads.\nWhich AWS service or feature should the company use to meet these requirements?",options:["Dedicated Hosts","AWS Outposts","Availability Zones","AWS Wavelength"],answer:[1],is_multi:false},
{question:"What is the recommended use case for Amazon EC2 On-Demand Instances?",options:["A steady-state workload that requires a particular EC2 instance configuration for a long period of time","A workload that can be interrupted for a project that requires the lowest possible cost","An unpredictable workload that does not require a long-term commitment","A workload that is expected to run for longer than 1 year"],answer:[2],is_multi:false},
{question:"A company wants to use an AWS networking solution that can act as a centralized gateway between multiple VPCs and on-premises networks.\nWhich AWS service or feature will meet this requirement?",options:["Gateway VPC endpoint","AWS Direct Connect","AWS Transit Gateway","AWS PrivateLink"],answer:[2],is_multi:false},
{question:"An administrator observed that multiple AWS resources were deleted yesterday.\nWhich AWS service will help identify the cause and determine which user deleted the resources?",options:["AWS CloudTrail","Amazon Inspector","Amazon GuardDuty","AWS Trusted Advisor"],answer:[0],is_multi:false},
{question:"To assist companies with Payment Card Industry Data Security Standard (PCI DSS) compliance in the cloud, AWS provides:",options:["physical Inspections of data centers by appointment.","required PCI compliance certifications for any application running on AWS.","an AWS Attestation of Compliance (AOC) report for specific AWS services.","professional PCI compliance services."],answer:[2],is_multi:false},
{question:"A company hosts a web application on AWS. The company has improved the availability of its application by provisioning multiple Amazon EC2 instances. The company wants to distribute its traffic across the EC2 instances while providing a single point of contact to the web clients.\nWhich AWS service can distribute the traffic to multiple EC2 instances as targets?",options:["VPC endpoints","Application Load Balancer","NAT gateway","Internet gateway"],answer:[1],is_multi:false},
{question:"What is the total volume of data that can be stored in Amazon S3?",options:["10 PB","50 PB","100 PB","Virtually unlimited"],answer:[3],is_multi:false},
{question:"Which design principle is related to the reliability pillar according to the AWS Well-Architected Framework?",options:["Test recovery procedures","Experiment more often","Go global in minutes","Analyze and attribute to expenditure"],answer:[0],is_multi:false},
{question:"A company stores data in an Amazon S3 bucket.\nWhich task is the responsibility of AWS?",options:["Configure an S3 Lifecycle policy.","Activate S3 Versioning.","Configure S3 bucket policies.","Protect the infrastructure that supports S3 storage."],answer:[3],is_multi:false},
{question:"A company wants to transfer a virtual Windows Server 2022 that is currently running in its own data center to AWS. The company wants to automatically convert the existing server to run directly on AWS infrastructure instead of visualized hardware.\nWhich AWS service will meet these requirements?",options:["AWS DataSync","AWS Database Migration Service (AWS DMS)","AWS Application Discovery Service","AWS Application Migration Service"],answer:[3],is_multi:false},
{question:"Which AWS service is a fully managed NoSQL database service?",options:["Amazon RDS","Amazon Redshift","Amazon DynamoDB","Amazon Aurora"],answer:[2],is_multi:false},
{question:"A company deployed an application in multiple AWS Regions around the world. The company wants to improve the application's performance and availability.\nWhich AWS service will meet these requirements?",options:["AWS Global Accelerator","Amazon DataZone","AWS Cloud Map","AWS Auto Scaling"],answer:[0],is_multi:false},
{question:"A company wants to migrate its on-premises SQL Server database to the AWS Cloud. The company wants AWS to handle the day-to-day administration of the database.\nWhich AWS service will meet the company's requirements?",options:["Amazon EC2 for Microsoft SQL Server","Amazon DynamoDB","Amazon RDS","Amazon Aurora"],answer:[2],is_multi:false},
{question:"A company needs stateless network filtering for its VPC.\nWhich AWS service, tool, or feature will meet this requirement?",options:["AWS PrivateLink","Security group","Network access control list (ACL)","AWS WAF"],answer:[2],is_multi:false},
{question:"Which option is an advantage of AWS Cloud computing that minimizes variable costs?",options:["High availability","Economies of scale","Global reach","Agility"],answer:[1],is_multi:false},
{question:"A company has data lakes designed for high performance computing (HPC) workloads.\nWhich Amazon EC2 instance type should the company use to meet these requirements?",options:["General purpose instances","Compute optimized instances","Memory optimized instances","Storage optimized instances"],answer:[1],is_multi:false},
{question:"Which benefits does a company gain when the company moves from on-premises IT architecture to the AWS Cloud? (Choose two.)",options:["Reduced or eliminated tasks for hardware troubleshooting, capacity planning, and procurement","Elimination of the need for trained IT staff","Automatic security configuration of all applications that are migrated to the cloud","Elimination of the need for disaster recovery planning","Faster deployment of new features and applications"],answer:[0,4],is_multi:true},
{question:"A company is planning to migrate to the AWS Cloud. The company is conducting organizational transformation and wants to become more responsive to customer inquiries and feedback.\nWhich task should the company perform to meet these requirements, according to the AWS Cloud Adoption Framework (AWS CAF)? (Choose two.)",options:["Realign teams to focus on products and value streams.","Create new value propositions with new products and services.","Use agile methods to rapidly iterate and evolve.","Use a new data and analytics platform to create actionable insights.","Migrate and modernize legacy infrastructure."],answer:[0,2],is_multi:true},
{question:"A company that is planning to migrate to the AWS Cloud is based in an isolated area that has limited internet connectivity. The company needs to perform local data processing on premises. The company needs a solution that can operate without a stable internet connection.\nWhich AWS service will meet these requirements?",options:["Amazon S3","AWS Snowball Edge","AWS Storage Gateway","AWS Backup"],answer:[1],is_multi:false},
{question:"A company wants to build graph queries for real-time fraud pattern detection.\nWhich AWS service will meet this requirement?",options:["Amazon Neptune","Amazon DynamoDB","Amazon Timestream","Amazon Forecast"],answer:[0],is_multi:false},
{question:"A company wants to migrate to the AWS Cloud. The company needs the ability to acquire resources when the resources are necessary. The company also needs the ability to release those resources when the resources are no longer necessary.\nWhich architecture concept of the AWS Cloud meets these requirements?",options:["Elasticity","Availability","Reliability","Durability"],answer:[0],is_multi:false},
{question:"A company wants to deploy a web application as a containerized application. The company wants to use a managed service that can automatically create container images from source code and deploy the containerized application.\nWhich AWS service will meet these requirements?",options:["AWS Elastic Beanstalk","Amazon Elastic Container Service (Amazon ECS)","AWS App Runner","Amazon EC2"],answer:[2],is_multi:false},
{question:"A company has moved all its infrastructure to the AWS Cloud. To plan ahead for each quarter, the finance team wants to track the cost and usage data of all resources from previous months. The finance team wants to automatically generate reports that contains the data.\nWhich AWS service or feature should the finance team use to meet these requirements?",options:["Amazon Detective","AWS Pricing Calculator","AWS Budgets","AWS Savings Plans"],answer:[2],is_multi:false},
{question:"Which AWS Cloud Adoption Framework (AWS CAF) perspective focuses on real-time insights and answers questions about strategy?",options:["Operations","People","Business","Platform"],answer:[2],is_multi:false},
{question:"A company wants to migrate critical on-premises production systems to Amazon EC2 instances. The production instances will be used for at least 3 years. The company wants a pricing option that will minimize cost.\nWhich solution will meet these requirements?",options:["On-Demand Instances","Reserved Instances","Spot Instances","AWS Free Tier"],answer:[1],is_multi:false},
{question:"Which AWS Well-Architected Framework concept represents a system's ability to remain functional when the system encounters operational problems?",options:["Consistency","Elasticity","Durability","Latency"],answer:[2],is_multi:false},
{question:"Which pillar of the AWS Well-Architected Framework focuses on the ability to recover automatically from service interruptions?",options:["Security","Performance efficiency","Operational excellence","Reliability"],answer:[3],is_multi:false},
{question:"A company has multiple SQL-based databases located in a data center. The company needs to migrate all database servers to the AWS Cloud to reduce the cost of operating physical servers.\nWhich AWS service or resource will meet these requirements with the LEAST operational overhead?",options:["Amazon EC2 instances","Amazon RDS","Amazon DynamoDB","OpenSearch"],answer:[1],is_multi:false},
{question:"A company wants to build, train, and deploy machine learning (ML) models.\nWhich AWS service can the company use to meet this requirement?",options:["Amazon Personalize","Amazon Comprehend","Amazon Forecast","Amazon SageMaker"],answer:[3],is_multi:false},
{question:"Which AWS service or tool provides recommendations to help users get rightsized Amazon EC2 instances based on historical workload usage data?",options:["AWS Pricing Calculator","AWS Compute Optimizer","AWS App Runner","AWS Systems Manager"],answer:[1],is_multi:false},
{question:"A company wants to explore and analyze data in Amazon S3 by using a programming language.\nWhich AWS service will meet these requirements?",options:["Amazon Kendra","Amazon Athena","Amazon Comprehend","Amazon SageMaker"],answer:[1],is_multi:false},
{question:"A company needs to run an application on Amazon EC2 instances without interruption.\nWhich EC2 instance purchasing option will meet this requirement MOST cost-effectively?",options:["Standard Reserved Instances","Convertible Reserved Instances","On-Demand Instances","Spot Instances"],answer:[0],is_multi:false},
{question:"A company wants a fully managed service that centralizes and automates data protection across AWS services and hybrid workloads.\nWhich AWS service will meet these requirements?",options:["AWS Artifact","AWS Backup","AWS Batch","AWS Shield"],answer:[1],is_multi:false},
{question:"A company plans to migrate its application from on premises to the AWS Cloud. The company needs to gather usage and configuration data for the application components.\nWhich AWS service will meet these requirements?",options:["AWS Database Migration Service (AWS DMS)","AWS Transfer Family","AWS Application Discovery Service","AWS Global Accelerator"],answer:[2],is_multi:false},
{question:"Which design principle aligns with performance efficiency pillar of the AWS Well-Architected Framework?",options:["Using serverless architectures","Scaling horizontally","Measuring the cost of workloads","Using managed services"],answer:[0],is_multi:false},
{question:"A company wants to provide low latency to its users around the world.\nWhich feature of the AWS Cloud meet this requirement?",options:["Global infrastructure","Pay as-you-go pricing","Managed services","Economy of scale"],answer:[0],is_multi:false},
{question:"Which type of workload should a company run on Amazon EC2 Spot Instances?",options:["A steady-state workload that requires a particular EC2 instance configuration for a long period of time","A workload that can be interrupted and can control costs","A steady-state workload that does not require a long-term commitment","A workload that cannot be interrupted and can control costs"],answer:[1],is_multi:false},
{question:"A company has multiple AWS accounts. The company needs to receive a consolidated bill from AWS and must centrally manage security and compliance.\nWhich AWS service or feature should the company use to meet these requirements?",options:["AWS Cost and Usage Report","AWS Organizations","AWS Config","AWS Security Hub"],answer:[1],is_multi:false},
{question:"For which use case are Amazon EC2 On-Demand Instances MOST cost-effective?",options:["Compute-intensive video transcoding that can be restarted if necessary","An instance in continual use for 1 month to conduct quality assurance tests","An instance that runs a web server that will run for 1 year","An instance that runs a database that will run for 3 years"],answer:[1],is_multi:false},
{question:"A company has developed a new in-house application. The company does not have a way to determine or predict the usage demand that the application will create.\nWhich AWS Cloud computing benefit is the company seeking?",options:["Easy to use","Cost-effective","Secure","Scalable and high performance"],answer:[3],is_multi:false},
{question:"Which AWS offering can analyze a company's AWS environment to discover security vulnerabilities on Amazon EC2 instances?",options:["Amazon Inspector","Amazon Macie","AWS Shield Standard","Security groups"],answer:[0],is_multi:false},
{question:"A company plans to onboard new employees that will be working remotely. The company needs to set up Windows virtual desktops to create a working environment for the new employees. The employees must be able access the working environment from anywhere and by using their computer or a web browser.\nWhich AWS service or feature will meet these requirements?",options:["Dedicated Hosts","AWS Global Accelerator","Amazon Workspaces","Amazon CloudFront"],answer:[2],is_multi:false},
{question:"A company wants to visualize and manage AWS Cloud costs and usage for a specific period of time.\nWhich AWS service or feature will meet these requirements?",options:["Cost Explorer","Consolidated billing","AWS Organizations","AWS Budgets"],answer:[0],is_multi:false},
{question:"A company is releasing a business-critical application. Before the release, the company needs strategic planning assistance from AWS. During the release, the company needs AWS infrastructure event management and real-time support.\nWhat should the company do to meet these requirements?",options:["Access AWS Trusted Advisor","Contact the AWS Partner Network (APN)","Sign up for AWS Enterprise Support","Contact AWS Professional Services"],answer:[2],is_multi:false},
{question:"A company wants an Amazon S3 solution that provides access to object storage within single-digit milliseconds.\nWhich solution will meet these requirements?",options:["S3 Express One Zone","S3 Standard","S3 Glacier Flexible Retrieval","S3 Glacier Instant Retrieval"],answer:[0],is_multi:false},
{question:"A company runs an uninterruptible Amazon EC2 workload on AWS 24 hours a day, 7 days a week. The company will require the same instance family and instance type to run the workload for the next 12 months.\nWhich combination of purchasing options should the company choose to MOST optimize costs? (Choose two.)",options:["Standard Reserved Instance","Convertible Reserved Instance","Compute Savings Plan","Spot Instance","All Upfront payment"],answer:[0,4],is_multi:true},
{question:"A company wants to run its application's code without having to provision and manage servers.\nWhich AWS service will meet this requirement?",options:["AWS Glue","AWS Lambda","AWS CodeDeploy","Amazon CodeGuru"],answer:[1],is_multi:false},
{question:"A company is planning to migrate to the AWS Cloud. The company needs to understand the existing on-premises usage and configuration. The company does not want to replicate its workloads to AWS, yet.\nWhich AWS service or tool will meet these requirements?",options:["AWS Application Discovery Service","AWS Application Migration Service","Cloud Migration Factory","AWS Transfer Family"],answer:[0],is_multi:false},
{question:"A company wants to allow its employees to work remotely from home. The company's employees use Windows or Linux desktops. The company's employees need access from anywhere and at anytime by using any supported devices.\nWhich AWS service will meet these requirements?",options:["Amazon Workspaces","Amazon AppStream 2.0","Amazon Keyspaces (for Apache Cassandra)","AWS Cloud9"],answer:[0],is_multi:false},
{question:"A company wants to test a new application.\nWhich AWS principle will help the company test the application?",options:["Make long-term commitments in exchange for a cost discount.","Scale up and down when needed without any long-term commitments.","Have total control over the application infrastructure.","Manage all of the maintenance tasks associated with the cloud."],answer:[1],is_multi:false},
{question:"A company has deployed several public applications behind Application Load Balancers. The company wants to improve the performance of the applications.\nWhich AWS service will meet these requirements?",options:["AWS Global Accelerator","Amazon Connect","Amazon ElastiCache","Amazon CloudWatch"],answer:[0],is_multi:false},
{question:"A company has an on-premises application. The application has processing times of less than 5 minutes and is invoked only a few times each day. The company wants to move the application to the AWS Cloud.\nWhich AWS service will support this application MOST cost-effectively?",options:["Amazon Elastic Container Service (Amazon ECS)","AWS Lambda","Amazon Elastic Kubernetes Service (Amazon EKS)","Amazon EC2"],answer:[1],is_multi:false},
{question:"A company is learning about the perspectives of the AWS Cloud Adoption Framework (AWS CAF).\nWhich perspective of the AWS CAF addresses the strategy management capability?",options:["Business perspective","People perspective","Governance perspective","Operations perspective"],answer:[0],is_multi:false},
{question:"A company wants to consolidate its call centers to improve the customer voice and chat experience with call center agents.\nWhich AWS service or tool will meet these requirements?",options:["Amazon Simple Notification Service (Amazon SNS)","AWS Support Center","Amazon Cognito","Amazon Connect"],answer:[3],is_multi:false},
{question:"A company needs to provision uninterruptible Amazon EC2 instances, when needed, and pay for compute capacity by the second.\nWhich EC2 instance purchasing option will meet these requirements?",options:["Reserved Instances","Spot Instances","On-Demand Instances","Dedicated Instances"],answer:[2],is_multi:false},
{question:"Which AWS service can migrate Amazon EC2 instances from one AWS Region to another?",options:["AWS Application Migration Service","AWS Database Migration Service (AWS DMS)","AWS DataSync","AWS Migration Hub"],answer:[0],is_multi:false},
{question:"A company needs to block SQL injection attacks.\nWhich AWS service or feature provides this functionality?",options:["AWS WAF","Network ACLs","Security groups","AWS Trusted Advisor"],answer:[0],is_multi:false},
{question:"A company wants to run its application on Amazon EC2 instances. The company needs to keep the application on-premises to meet a compliance requirement.\nWhich AWS offering will meet these requirements?",options:["Dedicated Instances","Amazon CloudFront","AWS Fargate","AWS Outposts"],answer:[3],is_multi:false},
{question:"Which AWS service can manage permissions for AWS resources by using policies?",options:["Amazon Inspector","Amazon Detective","AWS Identity and Access Management (IAM)","Amazon GuardDuty"],answer:[2],is_multi:false},
{question:"A company needs to run some of its workload in the AWS Cloud. The company needs to keep some of the workload in its own on-site data center due to compliance reasons.\nWhich AWS service will meet these requirements?",options:["AWS Config","AWS Outposts","Amazon Lightsail","Amazon Connect"],answer:[1],is_multi:false},
{question:"A company wants to deploy an application that stores data in a relational database. The company wants database tasks, such as automated backups and database snapshots, to be managed by AWS.\nWhich AWS service will meet these requirements?",options:["Amazon DocumentDB","Amazon RDS","Amazon Elastic Block Store (Amazon EBS)","Amazon S3"],answer:[1],is_multi:false},
{question:"A company that operates on-premises servers decides to start a new line of business. The company determines that additional servers are required for the new workloads.\nWhich advantage of cloud computing can help the company to provision additional infrastructure as quickly as possible?",options:["Benefit from massive economies of scale","Increase speed and agility","Trade fixed expense for variable expense","Go global in minutes"],answer:[1],is_multi:false},
];


// ============================================================
// HELPERS
// ============================================================
const delay  = (ms) => new Promise(r => window.setTimeout(r, ms));
const log    = (m)  => { console.log(`%c[QZ] ${m}`, 'color:#4CAF50;font-weight:bold'); uiLog(m); };
const logErr = (m)  => { console.error(`[QZ ERR] ${m}`); uiLog('❌ ' + m); };

const waitUntil = async (fn, timeout = 30000, interval = 400) => {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    try { if (await fn()) return true; } catch(e) {}
    await delay(interval);
  }
  throw new Error('Timeout: ' + fn.toString().slice(0, 80));
};

const getEditors     = () => document.querySelectorAll('.tiptap.ProseMirror');
const getOptionCards = () => document.querySelectorAll('div.question-option');

// ============================================================
// SAFE RELOAD — bypass "Reload site?" popup
// ============================================================
const safeReload = () => {
  // Tắt toàn bộ beforeunload để không hiện popup
  window.onbeforeunload = null;
  window.addEventListener('beforeunload', (e) => {
    e.stopImmediatePropagation();
    delete e.returnValue;
  }, { capture: true });

  // Navigate bằng href thay vì reload() để tránh popup
  const base = window.location.href.split('?')[0];
  window.location.href = base + '?qz_ts=' + Date.now();
};

// ============================================================
// LOCALSTORAGE KEYS
// ============================================================
const LS_CKPT        = 'qz_ckpt';
const LS_AUTO        = 'qz_auto';
const LS_RETRY_COUNT = 'qz_retry_count';
const LS_RETRY_IDX   = 'qz_retry_idx';
const LS_MODE        = 'qz_mode'; // 'normal' | 'retry'

const saveCheckpoint = (idx) => {
  localStorage.setItem(LS_CKPT, idx);
  localStorage.setItem(LS_AUTO, 'true');
  localStorage.setItem(LS_MODE, 'normal');
  log(`💾 Checkpoint: câu ${idx + 1}`);
};

const loadCheckpoint = () => {
  const v = localStorage.getItem(LS_CKPT);
  return v !== null ? parseInt(v) : START_FROM;
};

const saveRetryState = (idx, count) => {
  localStorage.setItem(LS_CKPT,        idx);
  localStorage.setItem(LS_AUTO,        'true');
  localStorage.setItem(LS_MODE,        'retry');
  localStorage.setItem(LS_RETRY_IDX,   idx);
  localStorage.setItem(LS_RETRY_COUNT, count);
  log(`🔁 Retry state: câu ${idx + 1}, lần ${count}/${MAX_RETRY}`);
};

const loadRetryCount = () => {
  const v = localStorage.getItem(LS_RETRY_COUNT);
  return v !== null ? parseInt(v) : 0;
};

const isRetryMode     = () => localStorage.getItem(LS_MODE) === 'retry';
const shouldAutoStart = () => AUTO_START && localStorage.getItem(LS_AUTO) === 'true';

const clearAutoFlag = () => {
  localStorage.removeItem(LS_AUTO);
  localStorage.removeItem(LS_MODE);
  localStorage.removeItem(LS_RETRY_COUNT);
  localStorage.removeItem(LS_RETRY_IDX);
};

// ============================================================
// UI STATE
// ============================================================
let _isPaused  = false;
let _isStopped = false;
let _startTime = null;

// ============================================================
// UI HELPERS
// ============================================================
function uiLog(msg) {
  const el = document.getElementById('__qz_log');
  if (!el) return;
  const line = document.createElement('div');
  line.style.cssText = 'border-bottom:1px solid #222;padding:2px 0;';
  line.textContent = new Date().toLocaleTimeString() + ' › ' + msg;
  el.appendChild(line);
  while (el.children.length > 80) el.removeChild(el.firstChild);
  el.scrollTop = el.scrollHeight;
}

function setStatus(msg) {
  const el = document.getElementById('__qz_status');
  if (el) el.textContent = msg;
}

function setProgress(cur) {
  const el = document.getElementById('__qz_prog');
  if (el) el.textContent = `Progress: ${cur} / ${questions.length}`;
}

function setRetryBadge(count, idx) {
  const el = document.getElementById('__qz_retry');
  if (!el) return;
  el.textContent = count > 0
    ? `🔁 Retry câu ${idx + 1}: lần ${count}/${MAX_RETRY}`
    : '';
}

const btnCSS = (bg, fg) =>
  `padding:5px 9px;cursor:pointer;background:${bg};color:${fg};` +
  `border:none;border-radius:5px;font-size:11px;font-weight:bold;`;

// ============================================================
// COUNTDOWN
// ============================================================
const showCountdown = async (seconds, label = '') => {
  for (let i = seconds; i > 0; i--) {
    setStatus(`⏳ ${label}Chờ ${i}s...`);
    await delay(1000);
    if (_isStopped) return;
  }
};

// ============================================================
// CREATE UI
// ============================================================
function createUI() {
  if (document.getElementById('__qz_panel')) return;
  const ckpt = loadCheckpoint();
  const panel = document.createElement('div');
  panel.id = '__qz_panel';
  panel.style.cssText = `
    position:fixed;top:10px;right:10px;z-index:2147483647;
    background:#1a1a2e;color:#eee;padding:14px;border-radius:10px;
    width:290px;font-family:monospace;font-size:12px;
    box-shadow:0 4px 24px rgba(0,0,0,.6);border:1px solid #555;
  `;
  panel.innerHTML = `
    <div style="font-weight:bold;font-size:13px;margin-bottom:8px;color:#7DF9FF;">
      🎯 Quizizz Auto-Fill v10.0
    </div>
    <div style="margin-bottom:4px;font-size:10px;color:#f90;">
      ⚡ Batch: ${BATCH_SIZE} câu | Retry: ${MAX_RETRY} lần | Chờ: ${RETRY_WAIT_SEC}s
    </div>
    <div id="__qz_status" style="margin-bottom:4px;color:#aef;">⏳ Ready</div>
    <div id="__qz_prog"   style="margin-bottom:4px;color:#fa8;">
      Progress: ${ckpt} / ${questions.length}
    </div>
    <div id="__qz_retry"  style="margin-bottom:4px;color:#f66;font-size:11px;"></div>
    <div id="__qz_time"   style="margin-bottom:8px;color:#777;font-size:11px;">Elapsed: --</div>
    <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;">
      <button id="__qzStart"  style="${btnCSS('#2ecc71','#000')}">▶ START</button>
      <button id="__qzPause"  style="${btnCSS('#f39c12','#000')}">⏸ PAUSE</button>
      <button id="__qzResume" style="${btnCSS('#3498db','#fff')}">▶ RESUME</button>
      <button id="__qzStop"   style="${btnCSS('#e74c3c','#fff')}">⏹ STOP</button>
    </div>
    <div style="display:flex;gap:4px;margin-bottom:4px;align-items:center;">
      <span style="color:#aaa;">From Q#</span>
      <input id="__qzFrom" type="number" min="0" value="${ckpt}"
        style="width:60px;padding:4px;background:#333;color:#fff;
               border:1px solid #555;border-radius:4px;"/>
      <button id="__qzGo"    style="${btnCSS('#9b59b6','#fff')}">GO</button>
      <button id="__qzReset" style="${btnCSS('#888','#fff')}">RESET</button>
    </div>
    <div id="__qz_log"
      style="max-height:130px;overflow-y:auto;font-size:10px;
             background:#111;padding:6px;border-radius:4px;
             border:1px solid #333;line-height:1.5;">
    </div>
    <div style="margin-top:6px;font-size:10px;color:#555;">
      Hotkey: P = pause/resume &nbsp;|&nbsp; S = stop
    </div>
  `;
  document.body.appendChild(panel);

  document.getElementById('__qzStart').onclick = () => {
    const from = parseInt(document.getElementById('__qzFrom').value) || 0;
    _isStopped = false; _isPaused = false;
    runAutoFill(from);
  };
  document.getElementById('__qzPause').onclick  = () => {
    _isPaused = true;
    setStatus('⏸ Paused');
  };
  document.getElementById('__qzResume').onclick = () => {
    _isPaused = false;
    setStatus('▶ Running');
  };
  document.getElementById('__qzStop').onclick = () => {
    _isStopped = true; _isPaused = false;
    clearAutoFlag();
    setStatus('⏹ Stopped');
  };
  document.getElementById('__qzGo').onclick = () => {
    const idx = parseInt(document.getElementById('__qzFrom').value);
    if (!isNaN(idx)) { _isStopped = false; _isPaused = false; runAutoFill(idx); }
  };
  document.getElementById('__qzReset').onclick = () => {
    [LS_CKPT, LS_AUTO, LS_MODE, LS_RETRY_COUNT, LS_RETRY_IDX]
      .forEach(k => localStorage.removeItem(k));
    document.getElementById('__qzFrom').value = 0;
    setRetryBadge(0, 0);
    setStatus('🔄 Reset!');
    log('🔄 Đã reset checkpoint');
  };

  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === 'p' || e.key === 'P') {
      _isPaused = !_isPaused;
      setStatus(_isPaused ? '⏸ Paused' : '▶ Running');
    }
    if (e.key === 's' || e.key === 'S') {
      _isStopped = true;
      clearAutoFlag();
      setStatus('⏹ Stopped');
    }
  });

  window.setInterval(() => {
    if (!_startTime) return;
    const s = Math.floor((Date.now() - _startTime) / 1000);
    const el = document.getElementById('__qz_time');
    if (el) el.textContent = `Elapsed: ${Math.floor(s/60)}m ${s%60}s`;
  }, 1000);
}

// ============================================================
// CLICK ADD QUESTION (sau reload — không tự click Multiple Choice)
// ============================================================
const clickAddQuestionBtn = async () => {
  log('  ➕ Tìm nút Add Question...');
  await waitUntil(() =>
    Array.from(document.querySelectorAll('button')).some(b =>
      b.textContent.trim().toLowerCase().includes('add question') ||
      (b.getAttribute('aria-label') || '').toLowerCase().includes('add question')
    )
  , 30000, 600);

  const btn = Array.from(document.querySelectorAll('button')).find(b =>
    b.textContent.trim().toLowerCase().includes('add question') ||
    (b.getAttribute('aria-label') || '').toLowerCase().includes('add question')
  );
  if (!btn) throw new Error('Không tìm thấy nút Add Question');
  btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await delay(600);
  btn.click();
  log('  ✅ Đã ấn Add Question — vui lòng chọn "Multiple Choice"');
  setStatus('👆 Hãy chọn "Multiple Choice" trong modal!');
};

// ============================================================
// CLICK QUESTION TYPE
// ============================================================
const clickQuestionType = async () => {
  await delay(1600);
  await waitUntil(() =>
    Array.from(document.querySelectorAll('p, span, div'))
      .some(el => el.childElementCount === 0 &&
                  el.textContent.trim() === 'Multiple Choice')
  , 12000, 400);

  const textEl = Array.from(document.querySelectorAll('p, span, div'))
    .find(el => el.childElementCount === 0 &&
                el.textContent.trim() === 'Multiple Choice');
  if (!textEl) throw new Error('Không tìm thấy "Multiple Choice"');

  let clickTarget = textEl;
  for (let i = 0; i < 5; i++) {
    const parent = clickTarget.parentElement;
    if (!parent) break;
    if ((parent.className || '').includes('cursor-pointer')) {
      clickTarget = parent; break;
    }
    clickTarget = parent;
  }
  clickTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await delay(600);
  clickTarget.click();
  log('  ✅ Click "Multiple Choice"');
  await delay(2400);
};

// ============================================================
// TYPE INTO EDITOR
// ============================================================
const typeIntoEditor = async (index, text) => {
  const editors = getEditors();
  if (!editors[index]) throw new Error(
    `Không tìm thấy editor[${index}], có ${editors.length}`
  );
  const ed = editors[index];
  ed.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await delay(700);

  ed.click();  await delay(500);
  ed.focus();  await delay(500);

  document.execCommand('selectAll', false, null); await delay(300);
  document.execCommand('delete',    false, null); await delay(300);

  if (ed.textContent.trim().length > 0) {
    log(`  ⚠️ Editor[${index}] còn text, xóa lại...`);
    ed.click(); await delay(300);
    ed.focus(); await delay(300);
    ed.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'a', code: 'KeyA', ctrlKey: true, bubbles: true
    }));
    await delay(200);
    ed.dispatchEvent(new KeyboardEvent('keydown', {
      key: 'Delete', code: 'Delete', bubbles: true
    }));
    await delay(200);
    document.execCommand('selectAll', false, null); await delay(200);
    document.execCommand('delete',    false, null); await delay(200);
  }

  document.execCommand('insertText', false, text); await delay(500);
  ed.dispatchEvent(new Event('input', { bubbles: true }));
  await delay(700);
  log(`  ✏️ editor[${index}] ← "${text.slice(0, 50)}"`);
};

// ============================================================
// WAIT FOR EDITORS
// ============================================================
const waitForEditors = async (min = 5) => {
  await waitUntil(() => getEditors().length >= min, 15000, 400);
  await delay(1200);
  log(`  ✅ Editors: ${getEditors().length}`);
};

// ============================================================
// TOGGLE
// ============================================================
const isToggleOn = () => {
  const input = document.querySelector(
    '[data-testid="toggle-button-group-btn-2-button-input"]'
  );
  if (input) return input.getAttribute('aria-checked') === 'true';
  const div = document.querySelector(
    '[data-testid="toggle-button-group-btn-2-button"]'
  );
  return div?.className?.includes('bg-immersive-green') ?? false;
};

const ensureToggleOn = async () => {
  log('  🔘 Kiểm tra toggle...');
  if (isToggleOn()) { log('  ✅ Toggle đã ON!'); return true; }
  for (let attempt = 1; attempt <= 5; attempt++) {
    const toggleDiv = document.querySelector(
      '[data-testid="toggle-button-group-btn-2-button"]'
    );
    if (!toggleDiv) { await delay(1000); continue; }
    toggleDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await delay(500);
    toggleDiv.click();
    log(`  🖱️ Click toggle (${attempt}/5)`);
    await delay(2000);
    if (isToggleOn()) { log('  ✅ Toggle ON!'); return true; }
    await delay(500);
  }
  logErr('  ❌ Không bật được toggle!');
  return false;
};

// ============================================================
// ADD / ENSURE OPTIONS
// ============================================================
const addAnotherOption = async () => {
  const before = getEditors().length;
  const btn = document.querySelector('[data-testid="add-option-button"]');
  if (!btn) throw new Error('Không tìm thấy add-option-button');
  btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
  await delay(600);
  btn.click();
  log('  ➕ Add option');
  await waitUntil(() => getEditors().length > before, 8000, 300);
  await delay(1000);
  log(`  ✅ Options: ${getEditors().length - 1}`);
};

const ensureOptionCount = async (needed) => {
  log(`  📊 Options: có ${getEditors().length - 1}, cần ${needed}`);
  let attempts = 0;
  while (getEditors().length < needed + 1 && attempts < 6) {
    await addAnotherOption();
    attempts++;
  }
  log(`  ✅ Đủ ${getEditors().length - 1} options`);
};

// ============================================================
// SELECT ANSWERS
// ============================================================
const selectAnswers = async (answerIndices) => {
  await delay(800);
  log(`  🎯 Chọn đáp án: [${answerIndices}]`);
  for (const idx of answerIndices) {
    let btn = document.querySelector(
      `[data-testid="mcq-editor-mark-answer-${idx}-button"]`
    );
    if (!btn) {
      log(`  ⚠️ Fallback card[${idx}]`);
      const cards = getOptionCards();
      if (!cards[idx]) { logErr(`Card[${idx}] không tồn tại`); continue; }
      const btns = Array.from(cards[idx].querySelectorAll('button'));
      btn = btns.find(b => {
        const aria   = (b.getAttribute('aria-label') || '').toLowerCase();
        const testid = (b.getAttribute('data-testid') || '').toLowerCase();
        return !aria.includes('delete') && !aria.includes('upload') &&
               !testid.includes('delete') && !testid.includes('upload') &&
               !testid.includes('image');
      });
    }
    if (!btn) { logErr(`  ❌ Không tìm được btn đáp án [${idx}]`); continue; }
    btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await delay(600);
    btn.click();
    log(`  ✅ Chọn [${idx}]`);
    await delay(800);
  }
};

// ============================================================
// CLICK SAVE
// ============================================================
const clickSave = async () => {
  await delay(1200);
  await waitUntil(() =>
    !!document.querySelector('[data-testid="save-question-button"]')
  , 30000, 400);

  const btn = document.querySelector('[data-testid="save-question-button"]');
  if (!btn) throw new Error('Không tìm thấy save-question-button');
  btn.click();
  log('  💾 Clicked Save!');

  await waitUntil(() => {
    const urlOK  = !window.location.href.includes('/question/');
    const addBtn = Array.from(document.querySelectorAll('button'))
      .some(b =>
        b.textContent.trim().toLowerCase().includes('add question') ||
        (b.getAttribute('aria-label') || '').toLowerCase().includes('add question')
      );
    return urlOK || addBtn;
  }, 30000, 500);

  log('  ✅ Về list!');
  await delay(2000);
};

// ============================================================
// CLICK ADD QUESTION (giữa các câu trong cùng batch)
// ============================================================
const clickAddQuestion = async () => {
  log('  ➕ Tìm Add Question...');
  if (window.location.href.includes('/question/')) {
    log('  ⏳ Chờ về list...');
    await waitUntil(() =>
      !window.location.href.includes('/question/')
    , 15000, 500);
    await delay(1500);
  }
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      await delay(1500);
      await waitUntil(() =>
        Array.from(document.querySelectorAll('button')).some(b =>
          b.textContent.trim().toLowerCase().includes('add question') ||
          (b.getAttribute('aria-label') || '').toLowerCase().includes('add question')
        )
      , 25000, 500);
      const btn = Array.from(document.querySelectorAll('button')).find(b =>
        b.textContent.trim().toLowerCase().includes('add question') ||
        (b.getAttribute('aria-label') || '').toLowerCase().includes('add question')
      );
      if (!btn) throw new Error('Không tìm thấy Add Question');
      btn.click();
      log('  ✅ Add Question clicked');
      await delay(2400);
      return;
    } catch(err) {
      logErr(`  addQuestion attempt ${attempt}/3: ${err.message}`);
      if (attempt < 3) await delay(2000);
    }
  }
  throw new Error('clickAddQuestion thất bại sau 3 lần');
};

// ============================================================
// PROCESS 1 QUESTION
// ============================================================
const processQuestion = async (q, i) => {
  log(`\n━━━ Câu ${i + 1}/${questions.length}`);
  log(`     "${q.question.slice(0, 70)}"`);
  log(`     is_multi=${q.is_multi} | answers=[${q.answer}] | ${q.options.length} opts`);
  setStatus(`▶ Câu ${i + 1}/${questions.length}`);

  await clickQuestionType();
  await waitForEditors(5);

  if (q.is_multi) {
    await ensureToggleOn();
    await delay(2000);
    log(`  ✅ Editors sau toggle: ${getEditors().length}`);
  }

  await ensureOptionCount(q.options.length);
  await typeIntoEditor(0, q.question);

  for (let j = 0; j < q.options.length; j++) {
    await typeIntoEditor(j + 1, q.options[j]);
  }

  if (q.is_multi && !isToggleOn()) {
    log('  ⚠️ Toggle tắt! Bật lại...');
    await ensureToggleOn();
    await delay(2000);
  }

  await selectAnswers(q.answer);
  await clickSave();

  setProgress(i + 1);
  log(`✅ Xong câu ${i + 1}`);
};

// ============================================================
// XỬ LÝ LỖI: safeReload → chờ RETRY_WAIT_SEC → retry câu đó
// ============================================================
const handleErrorAndRetry = async (failedIdx) => {
  const currentRetry = loadRetryCount() + 1;

  if (currentRetry > MAX_RETRY) {
    logErr(`❌ Câu ${failedIdx + 1} thất bại sau ${MAX_RETRY} lần → BỎ QUA, sang câu ${failedIdx + 2}`);
    setStatus(`⏭ Bỏ qua câu ${failedIdx + 1}, sang câu ${failedIdx + 2}`);
    saveCheckpoint(failedIdx + 1);
    localStorage.setItem(LS_RETRY_COUNT, '0');
    await delay(2000);
    safeReload();
    return;
  }

  logErr(`⚠️ Lỗi câu ${failedIdx + 1} — Retry ${currentRetry}/${MAX_RETRY} sau ${RETRY_WAIT_SEC}s...`);
  setStatus(`🔁 Retry câu ${failedIdx + 1} (lần ${currentRetry}/${MAX_RETRY})`);
  setRetryBadge(currentRetry, failedIdx);
  saveRetryState(failedIdx, currentRetry);

  await delay(2000);
  safeReload();
};

// ============================================================
// MAIN LOOP - BATCH MODE
// ============================================================
const runAutoFill = async (startFrom) => {
  _isStopped = false;
  _isPaused  = false;
  _startTime = Date.now();

  const batchEnd = Math.min(startFrom + BATCH_SIZE, questions.length);
  log(`🚀 Batch: câu ${startFrom + 1} → ${batchEnd} / ${questions.length}`);
  setStatus(`▶ Batch ${startFrom + 1}~${batchEnd}`);

  for (let i = startFrom; i < batchEnd; i++) {
    if (_isStopped) { setStatus('⏹ Stopped'); log('⏹ Dừng'); clearAutoFlag(); return; }
    while (_isPaused) {
      setStatus('⏸ Paused...');
      await delay(500);
      if (_isStopped) { clearAutoFlag(); return; }
    }

    try {
      if (i > startFrom) await clickAddQuestion();
      await processQuestion(questions[i], i);
      window._lastSuccess = i;

      localStorage.setItem(LS_RETRY_COUNT, '0');
      setRetryBadge(0, i);
      saveCheckpoint(i + 1);
        questions[i] = null;
    } catch (err) {
      logErr(`\n❌ Lỗi câu ${i + 1}: ${err.message}`);
      setStatus(`❌ Lỗi câu ${i + 1}`);
      window._failedAt = i;
      await handleErrorAndRetry(i);
      return;
    }
  }

  if (batchEnd >= questions.length) {
    clearAutoFlag();
    setStatus('🎉 Hoàn thành!');
    log('🎉 HOÀN THÀNH TẤT CẢ!');
    _startTime = null;
    return;
  }

  log(`⏳ Xong batch! Câu ${startFrom + 1}~${batchEnd}. Reload sau 3s...`);
  setStatus(`🔄 Reload... (tiếp câu ${batchEnd + 1})`);
  await delay(3000);
  safeReload();
};

// ============================================================
// GLOBAL HELPER
// ============================================================
window.resumeFrom = (idx) => {
  log(`⏩ Resume câu ${idx + 1}`);
  saveCheckpoint(idx);
  _isStopped = false; _isPaused = false;
  runAutoFill(idx);
};

// ============================================================
// AUTO-START SAU RELOAD
// ============================================================
const autoStartAfterReload = async (ckpt, waitSec) => {
  const modeLabel = isRetryMode()
    ? `🔁 Retry câu ${ckpt + 1} (lần ${loadRetryCount()}/${MAX_RETRY})`
    : `🔄 Tiếp tục từ câu ${ckpt + 1}`;

  log(`${modeLabel} — chờ ${waitSec}s...`);
  setRetryBadge(isRetryMode() ? loadRetryCount() : 0, ckpt);

  await showCountdown(waitSec, isRetryMode() ? '[RETRY] ' : '');
  if (_isStopped) return;

  try {
    await clickAddQuestionBtn();
  } catch (err) {
    logErr(`Không ấn được Add Question: ${err.message}`);
    clearAutoFlag();
    return;
  }

  await delay(1000);
  log(`🚀 Bắt đầu từ câu ${ckpt + 1}`);
  setStatus(`▶ Bắt đầu từ câu ${ckpt + 1}`);

  if (!_isStopped) runAutoFill(ckpt);
};

// ============================================================
// INIT
// ============================================================
const initUI = () => {
  if (!document.body) {
    window.setTimeout(initUI, 100);
    return;
  }

  createUI();

  const ckpt = loadCheckpoint();
  setProgress(ckpt);
  const fromEl = document.getElementById('__qzFrom');
  if (fromEl) fromEl.value = ckpt;

  if (shouldAutoStart() && ckpt < questions.length) {
    const waitSec = isRetryMode() ? RETRY_WAIT_SEC : RELOAD_WAIT_SEC;
    autoStartAfterReload(ckpt, waitSec);
  } else {
    log(`✅ v10.0 loaded! Checkpoint: câu ${ckpt + 1}. Nhấn START hoặc GO.`);
  }
};

window.setTimeout(initUI, 2000);

})();
