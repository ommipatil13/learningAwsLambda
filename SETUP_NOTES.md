# AWS Lambda & GitHub CI/CD Setup Guide

This document covers the full process from creating a GitHub repository to deploying an AWS Lambda function via GitHub Actions pipeline. Keep these notes for future reference.

---

## 1. Create GitHub Repository

1. Log in to GitHub.
2. Click **New repository**.
3. Name it `learningAwsLambda` (or similar) and choose public/private.
4. Initialize with a `README.md` (optional).
5. Clone the repo locally:
   ```powershell
   git clone https://github.com/your-username/learningAwsLambda.git
   cd learningAwsLambda
   ```

6. Add initial Lambda code file `index.js`:
   ```javascript
   // Basic Hello World Lambda Function
   exports.handler = async (event) => {
       return {
           statusCode: 200,
           body: JSON.stringify('Hello from AWS Lambda!')
       };
   };
   ```

7. Commit and push:
   ```powershell
   git add index.js
   git commit -m "initial lambda function"
   git push origin main
   ```

## 2. Setup AWS Lambda Function

1. Sign in to AWS Console and navigate to **Lambda**.
2. Click **Create function**.
3. Choose **Author from scratch**.
   - Name: `learningAwsLambda`
   - Runtime: Node.js 24.x (or your preferred version)
   - Architecture: x86_64 (default)
4. Create function.
5. Use the inline editor or upload code, set the handler to `index.handler`.
6. Test the function using the **Test** tab and default event; expect a 200 response.

## 3. Create Function URL (optional for testing)

1. In Lambda console, select your function.
2. Click **Configuration > Function URL**.
3. Click **Create function URL**.
   - Auth type: **NONE** (for public access while learning).
   - Invoke mode: **BUFFERED**.
4. Save and copy the generated URL.
5. Paste in browser to see the response.

## 4. Build GitHub Actions CI/CD Workflow

1. Create directory `.github/workflows` in repo.
2. Add `deploy.yml` file with content:
   ```yaml
   name: Deploy Lambda

   on:
     push:
       branches:
         - main

   jobs:
     deploy:
       runs-on: ubuntu-latest

       steps:
         - name: Checkout repository
           uses: actions/checkout@v3

         - name: Configure AWS credentials
           uses: aws-actions/configure-aws-credentials@v2
           with:
             aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
             aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
             aws-region: us-east-1

         - name: Zip and deploy
           run: |
             zip function.zip index.js
             aws lambda update-function-code \
               --function-name learningAwsLambda \
               --zip-file fileb://function.zip
   ```

3. Commit and push workflow file:
   ```powershell
   git add .github/workflows/deploy.yml
   git commit -m "add ci/cd workflow"
   git push origin main
   ```

## 5. Create AWS Access Keys for GitHub

1. Go to **IAM > Users** in AWS console.
2. Select a user or create new one.
3. Open **Security credentials** tab.
4. Click **Create access key**.
5. Optionally add tag description.
6. Click create and copy both values (access key ID and secret key).
7. Attach a policy allowing Lambda updates (e.g., `AWSLambda_FullAccess`).

## 6. Configure GitHub Secrets

1. In GitHub repo, go to **Settings > Secrets and variables > Actions**.
2. Add two secrets:
   - `AWS_ACCESS_KEY_ID` → value from IAM.
   - `AWS_SECRET_ACCESS_KEY` → secret value from IAM.
3. Optionally add `AWS_REGION` if not using default.

## 7. Triggering CI/CD

1. Make any change (e.g., edit `index.js` message).
2. Commit and push to `main`.
3. Visit **Actions** tab to see the workflow run.
4. Confirm deployment by testing Lambda or hitting function URL.

## 8. Security Notes

- **Never** commit secrets or credentials to repo.
- Rotate access keys if exposed.
- Use IAM policies with least privilege.

## 9. Further Enhancements

- Add tests or linting steps to workflow.
- Use SAM, Serverless Framework, or CloudFormation for infrastructure as code.
- Add multiple stages (dev/prod) with separate branches or pipelines.
- Configure CORS and auth when making function public.

---

Keep this file updated as you learn more! Good luck with AWS Lambda 🚀

---

## 10. Basic Concepts You Should Learn

As you continue exploring AWS, it's helpful to understand some core services and how they relate. Here's a quick Q&A and guidance:

### What is a VPC (Virtual Private Cloud)?
A VPC is a private network you create within your AWS account. Think of it like your home's Wi-Fi network: devices (EC2, Lambda, RDS) are connected within it and can be isolated from the public internet or from other networks.

**Example:** You launch a web server and a database. The web server needs internet access, but the database should be private. You create a VPC with two subnets (public and private). The web server lives in the public subnet and the database in the private one, allowing only the web server to communicate with the database. Security groups act as firewalls controlling traffic.

### What other basics should I learn?
- **EC2** – virtual machines in the cloud (Linux/Windows servers).
- **S3** – object storage for files, backups, or static website hosting.
- **IAM** – manage users, roles, and permissions (who can do what).
- **Lambda** – serverless functions (you write code, AWS runs it).
- **API Gateway** – create HTTP endpoints for Lambda or other services.
- **RDS / DynamoDB** – managed SQL or NoSQL databases.
- **CloudWatch** – logging and monitoring for your applications.
- **S3 + CloudFront** – content delivery network for fast static content.
- **ECS / EKS** – run containerized applications.
- **CloudFormation / SAM / CDK** – infrastructure as code to define AWS resources declaratively.

### Learning path suggestions
1. Start with IAM so you understand identity and access.
2. Launch an EC2 instance inside a VPC and SSH into it.
3. Create an S3 bucket and upload/download a file.
4. Build a Lambda function with API Gateway (as in this repo).
5. View logs in CloudWatch and set up simple alarms.
6. Launch an RDS database and connect to it.
7. Convert these setups into CloudFormation or SAM templates.
8. Explore more advanced services (ECS/EKS, Step Functions, SQS, etc.) as you go.

### Quick reference questions
- **Do I always need a VPC?** Lambda functions run outside of a VPC by default. Attach a VPC only when the function needs to access resources inside that VPC, like a private RDS instance.
- **What is a subnet?** A subnet is a range of IP addresses within your VPC. You typically create public and private subnets.
- **Security Group vs Network ACL?** Security groups are stateful and apply to individual resources. Network ACLs are stateless and operate at the subnet level.

Keep experimenting and updating these notes with what you learn. AWS is vast, but taking it step by step makes it manageable!
