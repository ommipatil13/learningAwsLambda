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

## 10. Comprehensive VPC (Virtual Private Cloud) Guide

### What is a VPC?
A **VPC** is your own isolated network in AWS. Imagine you have a private neighborhood where you control all the roads, who can enter, who can leave, and how houses communicate with each other. Everything in AWS (EC2, RDS, Lambda, etc.) lives in a VPC.

**Key Point**: AWS provides you a default VPC, but you should create your own custom VPC for learning and production.

---

### VPC FAQs (Most Common Questions)

**Q1: Do I always need to create my own VPC?**  
A: No. AWS provides a "default VPC" automatically. You can use it to start, but for production and learning, create a custom VPC so you understand and control everything.

**Q2: What is the CIDR block?**  
A: CIDR (Classless Inter-Domain Routing) is the IP address range for your VPC. Example: `10.0.0.0/16` means all IPs from `10.0.0.0` to `10.0.255.255` (65,536 addresses). The `/16` is the "block size."
- `/16` = 65,536 IPs (large network)
- `/24` = 256 IPs (small network)
- `/32` = 1 IP

**Q3: What's the difference between a public and private subnet?**  
A: 
- **Public subnet**: Has a route to the Internet Gateway, so resources here can reach the internet and be reached from the internet.
- **Private subnet**: Does NOT have a route to the Internet Gateway. Resources here cannot reach the internet directly (but can through a NAT Gateway).

**Q4: Why do I need both public and private subnets?**  
A: Security! Your database (RDS) should be **private** so hackers can't access it directly from the internet. Your web server (EC2) should be **public** so users can reach it. Only the web server talks to the database.

**Q5: What is a route table?**  
A: A route table is like a "routing map" that says "if traffic goes here, send it there." Example:
- Destination `0.0.0.0/0` (anywhere) → Target `igw-xxx` (Internet Gateway) = traffic goes to the internet
- Destination `10.0.0.0/16` (internal) → Target `local` = traffic stays inside VPC

**Q6: What is a Security Group?**  
A: A firewall for individual resources (EC2, RDS, etc.). It controls **inbound** (incoming) and **outbound** (outgoing) traffic.

Example:
```
EC2 Security Group:
  Inbound: Allow port 80 (HTTP) from 0.0.0.0/0 (anyone)
  Inbound: Allow port 22 (SSH) from 203.0.113.0/32 (only your IP)
  Outbound: Allow all traffic to anywhere

RDS Security Group:
  Inbound: Allow port 3306 (MySQL) from EC2's security group only
  Outbound: None needed (it's a database)
```

**Q7: What is a Network ACL (NACL)?**  
A: A subnet-level firewall. Every subnet has a NACL that controls traffic entering/leaving. Unlike Security Groups, NACLs are **stateless** (you must define both inbound AND outbound rules).

**Q8: What's the difference between Security Group and NACL?**  

| Feature | Security Group | NACL |
|---------|---|---|
| **Level** | Instance | Subnet |
| **Stateful** | Yes (tracks connections) | No (must define both directions) |
| **Applies to** | Individual resources | Entire subnet |
| **Default** | Allow nothing inbound (deny all) | Allow all inbound + outbound |
| **Use case** | Fine-grained control | Extra layer of security |

**Q9: What is an Internet Gateway?**  
A: A door that connects your VPC to the internet. Without it, nothing inside your VPC can reach the internet or be reached from it.

**Q10: What is a NAT Gateway?**  
A: **NAT = Network Address Translation**. A NAT Gateway lets private resources (in a private subnet) reach the internet, but prevents the internet from initiating connections to them. It translates their private IP to public for outgoing traffic.

Example use case:
```
EC2 in private subnet needs to download software updates from the internet.
- EC2 sends request to NAT Gateway
- NAT Gateway sends request to internet (from its public IP)
- Internet response comes back to NAT Gateway
- NAT Gateway forwards response to EC2
- Internet never knows EC2's IP (only NAT's public IP)
```

**Q11: Does Lambda need to be in a VPC?**  
A: By default, NO. Lambda runs outside your VPC. But if your Lambda needs to talk to a private RDS or EC2, you must **attach it to the VPC**.

**Q12: Can resources in different subnets talk to each other?**  
A: YES, if they're in the same VPC. They communicate through the VPC's internal routing. But Security Groups still apply.

---

### VPC Architecture - Real Example

```
AWS Account
│
└─ VPC: 10.0.0.0/16
   │
   ├─ Public Subnet 1: 10.0.1.0/24
   │  ├─ Internet Gateway (igw-xxx)
   │  ├─ Route Table:
   │  │  └─ 0.0.0.0/0 → igw-xxx (internet)
   │  └─ Resources:
   │     ├─ EC2 Web Server (10.0.1.100)
   │     │  └─ Security Group: Allow 80 (HTTP), 443 (HTTPS), 22 (SSH)
   │     └─ NAT Gateway (sits here, routes traffic from private subnet)
   │
   ├─ Private Subnet 1: 10.0.2.0/24
   │  ├─ Route Table:
   │  │  ├─ 10.0.0.0/16 → local
   │  │  └─ 0.0.0.0/0 → NAT Gateway (for outgoing internet traffic)
   │  └─ Resources:
   │     └─ RDS MySQL Database (10.0.2.50)
   │        └─ Security Group: Allow 3306 (MySQL) from EC2's SG
   │
   └─ Private Subnet 2: 10.0.3.0/24
      └─ Resources:
         └─ EC2 Backend Server (10.0.3.100)
            └─ Security Group: Allow 5000 (custom port) from Web Server's SG
```

**Data Flow**:
1. User hits `example.com` → DNS resolves to EC2's public IP (10.0.1.100)
2. User's request reaches EC2 web server (port 80)
3. Web server needs data, queries RDS (10.0.2.50:3306)
4. RDS security group allows traffic from web server → query succeeds
5. Web server sends response back to user
6. Hacker tries to reach RDS directly from internet → blocked (private subnet, no internet gateway)

---

### Step-by-Step: Create a VPC from Scratch

**1. Create VPC**
```
AWS Console → VPC → Create VPC
  Name: MyAppVPC
  CIDR: 10.0.0.0/16
```

**2. Create Internet Gateway**
```
AWS Console → VPC → Internet Gateways → Create
  Name: MyIGW
  Attach to: MyAppVPC
```

**3. Create Public Subnet**
```
AWS Console → VPC → Subnets → Create Subnet
  VPC: MyAppVPC
  Name: PublicSubnet1
  CIDR: 10.0.1.0/24
  Availability Zone: us-east-1a
```

**4. Create Private Subnet**
```
AWS Console → VPC → Subnets → Create Subnet
  VPC: MyAppVPC
  Name: PrivateSubnet1
  CIDR: 10.0.2.0/24
  Availability Zone: us-east-1a
```

**5. Create Route Table for Public Subnet**
```
AWS Console → VPC → Route Tables → Create
  VPC: MyAppVPC
  Name: PublicRT
  
  Add Route:
    Destination: 0.0.0.0/0
    Target: MyIGW
  
  Associate: PublicSubnet1
```

**6. Create Security Group for Web Server**
```
AWS Console → VPC → Security Groups → Create
  Name: WebServerSG
  VPC: MyAppVPC
  
  Inbound Rules:
    - Type: HTTP, Port 80, Source: 0.0.0.0/0
    - Type: HTTPS, Port 443, Source: 0.0.0.0/0
    - Type: SSH, Port 22, Source: YOUR_IP/32
  
  Outbound Rules:
    - All traffic to 0.0.0.0/0 (default)
```

**7. Create Security Group for Database**
```
AWS Console → VPC → Security Groups → Create
  Name: DatabaseSG
  VPC: MyAppVPC
  
  Inbound Rules:
    - Type: MySQL/Aurora, Port 3306, Source: WebServerSG
  
  Outbound Rules:
    - None needed (database doesn't initiate)
```

---

### VPC Troubleshooting Q&A

**Q: I launched an EC2 in a private subnet. Why can't I SSH into it?**  
A: Because it has no public IP and no route to the internet. Solutions:
1. Launch it in a public subnet instead, OR
2. Use AWS Systems Manager Session Manager (doesn't need SSH), OR
3. Set up a Bastion host in the public subnet to jump through

**Q: My EC2 in a public subnet still can't reach the internet. Why?**  
A: Check:
1. Does it have a public IP? (Elastic IP or auto-assign public IP)
2. Does the subnet have a route to Internet Gateway?
3. Does the EC2's Security Group allow outbound traffic?
4. Is the NACL blocking it?

**Q: My Lambda can't connect to my RDS in a private subnet.**  
A: 
1. Attach Lambda to the VPC (Configuration > VPC)
2. Select the same private subnet as RDS
3. Ensure RDS Security Group allows inbound from Lambda's Security Group
4. Check the RDS endpoint (host name) is correct

**Q: Can I have Lambda in public subnet and RDS in private?**  
A: You don't choose a subnet for Lambda. Lambda runs in AWS's own infrastructure but can be attached to your VPC. When attached, it uses private subnet IPs for communication.

---

### Other Basic AWS Services (Quick Overview)

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

### Learning Path
1. Start with IAM so you understand identity and access.
2. Create a VPC, subnets, security groups, and Internet Gateway.
3. Launch an EC2 instance in the public subnet and SSH into it.
4. Create RDS in a private subnet and connect from EC2.
5. Create an S3 bucket and upload/download a file.
6. Build a Lambda function with API Gateway (as in this repo).
7. View logs in CloudWatch and set up simple alarms.
8. Convert these setups into CloudFormation or SAM templates.
9. Explore more advanced services (ECS/EKS, Step Functions, SQS, etc.).

Keep experimenting and updating these notes with what you learn. AWS is vast, but taking it step by step makes it manageable!

---

## 11. Lambda Event Structure & Handling

### What is an Event?
When Lambda is triggered, it receives an **event** object containing data about what triggered it.

**Simple Event Example (from API Gateway HTTP request):**
```json
{
  "version": "2.0",
  "routeKey": "POST /hello",
  "rawPath": "/hello",
  "headers": {
    "content-type": "application/json"
  },
  "body": "{\"name\":\"John\"}",
  "isBase64Encoded": false
}
```

### Parsing Event Data in Lambda
```javascript
exports.handler = async (event) => {
    // Parse JSON body from request
    const body = JSON.parse(event.body);
    const name = body.name || 'Guest';
    
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: `Hello, ${name}!`
        })
    };
};
```

### Common Event Types
- **API Gateway**: HTTP requests with headers, body, query parameters
- **S3**: Triggered when a file is uploaded to a bucket
- **DynamoDB Streams**: Triggered when database records change
- **SNS/SQS**: Triggered by messages from notification or queue services
- **CloudWatch Events**: Triggered on a schedule (like cron jobs)
- **Cognito**: Triggered on user authentication events

---

## 12. Lambda Code Examples

### Example 1: Query Parameters (URL ?name=John)
```javascript
exports.handler = async (event) => {
    const name = event.queryStringParameters?.name || 'World';
    
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: `Hello, ${name}!`,
            timestamp: new Date().toISOString()
        })
    };
};
```

### Example 2: POST with JSON Body
```javascript
exports.handler = async (event) => {
    const data = JSON.parse(event.body);
    
    // Validate input
    if (!data.email || !data.password) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Email and password required' })
        };
    }
    
    // Process data (e.g., save to database)
    console.log('User registered:', data.email);
    
    return {
        statusCode: 201,
        body: JSON.stringify({ success: true, message: 'User registered' })
    };
};
```

### Example 3: Error Handling
```javascript
exports.handler = async (event) => {
    try {
        if (!event.body) {
            throw new Error('Request body is required');
        }
        
        const data = JSON.parse(event.body);
        const result = await someAsyncOperation(data);
        
        return {
            statusCode: 200,
            body: JSON.stringify(result)
        };
    } catch (error) {
        console.error('Error occurred:', error.message);
        
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};
```

### Example 4: Scheduled/Cron Function (CloudWatch Events)
```javascript
// This runs every day at 9 AM UTC
exports.handler = async (event) => {
    console.log('Daily maintenance job running at:', new Date().toISOString());
    
    // Perform daily cleanup, backups, report generation, etc.
    // Example: query database, send emails, etc.
    
    return {
        statusCode: 200,
        message: 'Daily job completed'
    };
};
```

---

## 13. Environment Variables & Configuration

### Setting Environment Variables in Lambda Console
1. Go to your function in AWS Lambda console.
2. Click **Configuration > Environment variables**.
3. Click **Edit** and add key-value pairs:
   - Key: `DB_HOST` → Value: `mydb.example.com`
   - Key: `DB_USER` → Value: `admin`
   - Key: `DB_PASSWORD` → Value: `secret` (encrypted by AWS)

### Using Environment Variables in Code
```javascript
const dbHost = process.env.DB_HOST;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const environment = process.env.NODE_ENV || 'development';

exports.handler = async (event) => {
    console.log(`Running in ${environment} mode`);
    console.log(`Connecting to database at ${dbHost}`);
    
    // Connect to database...
    
    return { statusCode: 200, body: 'OK' };
};
```

### Setting Variables via Workflow (GitHub Actions)
Update your `.github/workflows/deploy.yml` to also set environment variables:
```yaml
steps:
  - name: Set Lambda environment variables
    run: |
      aws lambda update-function-configuration \
        --function-name learningAwsLambda \
        --environment Variables={DB_HOST=mydb.example.com,NODE_ENV=production}
```

---

## 14. CloudWatch Logs & Monitoring

### Viewing Logs
1. In Lambda console, click **Monitor > View logs in CloudWatch**.
2. You'll see log streams for each invocation.
3. All `console.log()` statements appear here.

### Example: Structured Logging
```javascript
exports.handler = async (event) => {
    const requestId = event.requestContext?.requestId || 'unknown';
    
    console.log(JSON.stringify({
        level: 'INFO',
        requestId: requestId,
        action: 'handler_started',
        timestamp: new Date().toISOString()
    }));
    
    try {
        // Your logic here
        console.log('Processing request...');
        
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Success' })
        };
    } catch (error) {
        console.error(JSON.stringify({
            level: 'ERROR',
            requestId: requestId,
            error: error.message,
            stack: error.stack
        }));
        
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};
```

### Setting Up Alarms
1. In CloudWatch, go to **Alarms > Create alarm**.
2. Select your Lambda function.
3. Set metrics to watch (e.g., Errors, Duration, Throttles).
4. Choose notification (SNS topic or email).

---

## 15. Testing Lambda Functions

### Test in Lambda Console
1. In Lambda, click the **Test** tab.
2. Create a test event:
   ```json
   {
     "queryStringParameters": {
       "name": "Alice"
     }
   }
   ```
3. Click **Test** and see the response.

### Test via Function URL
```bash
# Simple GET request
curl "https://xxxxx.lambda-url.us-east-1.on.aws/?name=Bob"

# POST with JSON
curl -X POST https://xxxxx.lambda-url.us-east-1.on.aws/ \
  -H "Content-Type: application/json" \
  -d '{\"email\":\"test@example.com\",\"password\":\"123456\"}'
```

### Test Locally (with AWS SAM)
You can test your function locally before pushing:
```bash
# Install AWS SAM CLI first (google "install AWS SAM")
sam local start-api

# Then call it locally
curl http://localhost:3000/
```

---

## 16. Connecting Lambda to a Database (RDS)

### Setup Steps
1. **Create RDS Instance** in AWS:
   - Go to RDS > click Create database
   - Choose MySQL or PostgreSQL
   - Note the endpoint (e.g., `mydb.xxxxx.us-east-1.rds.amazonaws.com`)
   - Store the username/password

2. **Place both in the same VPC**:
   - Your Lambda must have VPC access enabled
   - RDS must be in a private subnet (for security)
   - Both must be in the same VPC/security group

3. **Lambda code example** (with MySQL):
```javascript
const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

exports.handler = async (event) => {
    let connection;
    try {
        connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.query('SELECT * FROM users LIMIT 10');
        
        return {
            statusCode: 200,
            body: JSON.stringify(rows)
        };
    } catch (error) {
        console.error('Database error:', error.message);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    } finally {
        if (connection) await connection.end();
    }
};
```

4. **Update Lambda configuration**:
   - Click **Configuration > VPC**
   - Select your VPC and private subnet
   - Attach security group that allows access to RDS

5. **Install dependencies** in your workflow:
```yaml
- name: Install dependencies
  run: |
    cd ${{ github.workspace }}
    npm install  # installs packages from package.json
    zip -r function.zip node_modules index.js package.json
```

---

## 17. EC2, Lambda, RDS, VPC - Deep Dive

### EC2 (Virtual Server)
**What it is**: A virtual Linux/Windows machine running in AWS.
**Typical use**: Host web servers, background workers, or development environments.
**Cost**: Pay for every hour it runs (even if idle).

**Example scenario**:
```
You need a machine to run a Node.js web app 24/7.
You launch an EC2 instance (t2.micro = 1GB RAM, 1 CPU).
SSH into it, install Node.js and your app.
The instance runs continuously; you're billed hourly.
```

### Lambda (Serverless Function)
**What it is**: Upload code that runs only when triggered; you don't manage servers.
**Typical use**: Handle API requests, process file uploads, scheduled tasks.
**Cost**: Pay only for execution time (in milliseconds) and number of invocations.

**Example scenario**:
```
You have an API endpoint that processes images.
Lambda runs the code only when someone calls the endpoint.
If nobody calls it for a month, you pay $0.
If 1 million people call it, you pay a few dollars.
```

**Limits**: Max 15 minutes execution, limited to 10GB RAM, runs in isolated containers.

### RDS (Managed Database)
**What it is**: AWS manages your MySQL, PostgreSQL, Oracle, or SQL Server database.
**Typical use**: Store and query application data persistently.
**Cost**: Pay for instance type and storage (similar to EC2).

**Example scenario**:
```
You want a production MySQL database with backups and failover.
Instead of managing a Linux server + MySQL yourself,
RDS handles updates, backups, replication, and security patches.
You just connect and query.
```

### VPC (Your Private Network)
**What it is**: Isolated network where you launch EC2, RDS, and other resources.
**Typical use**: Control IP ranges, routing, and security; keep databases private.
**Cost**: Free (you pay for resources inside it, not the VPC itself).

**Example scenario**:
```
You have a web server (EC2) that needs to talk to a database (RDS).
Create a VPC with two subnets:
- Public subnet: EC2 instance (accessible from internet)
- Private subnet: RDS database (not accessible from internet, only from EC2)
Security Group on EC2 allows outbound to RDS on port 3306.
Security Group on RDS allows inbound from EC2's security group.
```

### How They Fit Together
```
Scenario: Building a web app

1. WebServer (EC2 or Lambda)
   ├─ In a VPC
   └─ Listens for HTTP requests

2. Database (RDS)
   ├─ In the same VPC (private subnet)
   └─ Stores user data

3. Network (VPC)
   ├─ Two subnets: public (web) and private (database)
   ├─ Security groups control traffic
   └─ Web server can reach database privately

Result:
- User visits your website (hits EC2 or Lambda)
- App queries the database (RDS) for user data
- Response is sent back to user
- Hacker cannot reach the database directly (it's private)
```

---

## 18. Common Errors & Troubleshooting

### "Handler not found" Error
**Problem**: Lambda can't find your handler function.
**Solution**: Ensure handler is set to `index.handler` and the file exports it correctly.
```javascript
// CORRECT
exports.handler = async (event) => {
    return { statusCode: 200 };
};

// WRONG (won't work)
function handler(event) {
    return { statusCode: 200 };
}
```

### "Timeout" Error
**Problem**: Lambda takes longer than the timeout setting allows.
**Solutions**:
1. Increase timeout in **Configuration > General configuration**
2. Optimize your code (make it faster)
3. Pre-warm connections (Lambda containers)

### "Permission Denied" When Accessing RDS
**Problem**: Lambda can't connect to the database.
**Solutions**:
1. Ensure Lambda is in the same VPC as RDS
2. Check RDS security group allows Lambda's security group
3. Verify environment variables (DB_HOST, username, password) are correct

### "Module not found" Error
**Problem**: npm package isn't installed.
**Solution**: Add `package.json` and install dependencies in workflow:
```json
{
  "name": "lambda-function",
  "version": "1.0.0",
  "dependencies": {
    "mysql2": "^3.0.0"
  }
}
```

Then in workflow before zipping:
```yaml
- run: npm install
```

### GitHub Actions Workflow Fails
**Check**:
1. Go to Actions tab > click failed run
2. Expand the failed step to see error message
3. Common causes:
   - Secrets not configured correctly
   - IAM user doesn't have permission
   - Function name is wrong

---

## 19. Cost Estimation & Best Practices

### Lambda Pricing (US East)
- **Requests**: $0.20 per million requests
- **Execution**: $0.0000166667 per GB-second (gigabyte-seconds)
  - 1 GB RAM running 1 second = ~$0.0000166667
  - 256 MB RAM running 1 second = ~$0.0000041667

### Example Cost
```
Scenario: 1 million requests per month, 200 ms execution, 512 MB RAM

Request cost: (1M × $0.20) / 1M = $0.20
Execution: 1M × 0.2s × 0.512 GB = 102,400 GB-seconds
Execution cost: 102,400 × $0.0000166667 = ~$1.71
Total: ~$2/month

Free tier: 1M requests + 400K GB-seconds per month (usually covers small apps)
```

### Cost Reduction Tips
1. **Lower memory**: 128 MB is cheaper but slower; find the sweet spot
2. **Optimize code**: Faster execution = less cost
3. **Use Lambda for bursty traffic**: EC2 costs the same idle or busy; Lambda doesn't
4. **Set alarms**: Monitor CloudWatch to catch runaway costs

---

## 20. Next Level: Infrastructure as Code

Instead of clicking AWS console, write code that creates resources.

### AWS SAM (Serverless Application Model) Example
**File: `template.yaml`**
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: Simple Lambda API

Globals:
  Function:
    Timeout: 20
    Runtime: nodejs24.x

Resources:
  LambdaFunction:
    Type: AWS::Serverless::Function
    Properties:
      FunctionName: learningAwsLambda
      CodeUri: .
      Handler: index.handler
      Environment:
        Variables:
          ENVIRONMENT: prod
      Events:
        ApiEvent:
          Type: Api
          Properties:
            Path: /
            Method: GET

Outputs:
  ApiEndpoint:
    Description: API Gateway endpoint URL
    Value: !Sub 'https://${ServerlessApi}.execute-api.${AWS::Region}.amazonaws.com/Prod/'
```

**Benefit**: Deploy with SAM CLI:
```bash
sam build
sam deploy --guided
```

Keep practicing and expanding your knowledge! 🚀
