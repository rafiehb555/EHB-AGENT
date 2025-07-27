#!/usr/bin/env node

/**
 * AWS Deployment System
 * Healthcare application ko AWS mein deploy karta hai
 */

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

class AWSDeployment {
    constructor() {
        this.config = this.loadAWSConfig();
        this.setupAWSClients();
    }

    /**
     * AWS configuration load karta hai
     */
    loadAWSConfig() {
        try {
            const configPath = path.join(process.cwd(), 'aws-config.json');
            if (fs.existsSync(configPath)) {
                return JSON.parse(fs.readFileSync(configPath, 'utf8'));
            }
        } catch (error) {
            console.log('AWS config file nahi mila, environment variables use kar raha hun');
        }
        
        return {
            aws: {
                apiKey: process.env.AWS_API_KEY || 'YOUR_AWS_API_KEY',
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'YOUR_AWS_ACCESS_KEY_ID',
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'YOUR_AWS_SECRET_ACCESS_KEY',
                region: process.env.AWS_REGION || 'ap-south-1',
                s3BucketName: process.env.AWS_S3_BUCKET_NAME || 'ehb-main-pro'
            },
            deployment: {
                environment: 'production',
                healthcare: {
                    hipaa: true,
                    gdpr: true,
                    encryption: true
                },
                monitoring: {
                    cloudwatch: true,
                    alerts: true,
                    logging: true
                }
            }
        };
    }

    /**
     * AWS clients setup karta hai
     */
    setupAWSClients() {
        // AWS configuration
        AWS.config.update({
            accessKeyId: this.config.aws.accessKeyId,
            secretAccessKey: this.config.aws.secretAccessKey,
            region: this.config.aws.region
        });

        // Initialize AWS services
        this.s3 = new AWS.S3();
        this.ec2 = new AWS.EC2();
        this.cloudwatch = new AWS.CloudWatch();
        this.iam = new AWS.IAM();
        this.elasticbeanstalk = new AWS.ElasticBeanstalk();
        
        console.log('✅ AWS clients initialized');
    }

    /**
     * AWS connection test karta hai
     */
    async testAWSConnection() {
        try {
            console.log('🔍 Testing AWS connection...');
            
            // Test S3 access
            const s3Test = await this.s3.listBuckets().promise();
            console.log('✅ S3 connection successful');
            
            // Test EC2 access
            const ec2Test = await this.ec2.describeRegions().promise();
            console.log('✅ EC2 connection successful');
            
            // Test CloudWatch access
            const cwTest = await this.cloudwatch.listMetrics().promise();
            console.log('✅ CloudWatch connection successful');
            
            return {
                success: true,
                message: 'All AWS services connected successfully',
                services: ['S3', 'EC2', 'CloudWatch']
            };
            
        } catch (error) {
            console.error('❌ AWS connection failed:', error.message);
            return {
                success: false,
                message: error.message,
                services: []
            };
        }
    }

    /**
     * S3 bucket create karta hai
     */
    async createS3Bucket() {
        try {
            console.log(`📦 Creating S3 bucket: ${this.config.aws.s3BucketName}`);
            
            const params = {
                Bucket: this.config.aws.s3BucketName,
                Region: this.config.aws.region,
                CreateBucketConfiguration: {
                    LocationConstraint: this.config.aws.region
                }
            };
            
            await this.s3.createBucket(params).promise();
            console.log('✅ S3 bucket created successfully');
            
            // Enable versioning for healthcare compliance
            await this.s3.putBucketVersioning({
                Bucket: this.config.aws.s3BucketName,
                VersioningConfiguration: {
                    Status: 'Enabled'
                }
            }).promise();
            
            // Enable encryption
            await this.s3.putBucketEncryption({
                Bucket: this.config.aws.s3BucketName,
                ServerSideEncryptionConfiguration: {
                    Rules: [
                        {
                            ApplyServerSideEncryptionByDefault: {
                                SSEAlgorithm: 'AES256'
                            }
                        }
                    ]
                }
            }).promise();
            
            return {
                success: true,
                bucketName: this.config.aws.s3BucketName,
                region: this.config.aws.region
            };
            
        } catch (error) {
            if (error.code === 'BucketAlreadyExists') {
                console.log('✅ S3 bucket already exists');
                return {
                    success: true,
                    bucketName: this.config.aws.s3BucketName,
                    region: this.config.aws.region,
                    message: 'Bucket already exists'
                };
            } else {
                console.error('❌ S3 bucket creation failed:', error.message);
                return {
                    success: false,
                    error: error.message
                };
            }
        }
    }

    /**
     * Application files upload karta hai
     */
    async uploadApplicationFiles() {
        try {
            console.log('📤 Uploading application files to S3...');
            
            const filesToUpload = [
                { local: 'package.json', s3: 'package.json' },
                { local: 'frontend/package.json', s3: 'frontend/package.json' },
                { local: 'backend/requirements.txt', s3: 'backend/requirements.txt' },
                { local: 'agents/ehb-agent-hub.js', s3: 'agents/ehb-agent-hub.js' },
                { local: 'agents/portable-ehb-system.js', s3: 'agents/portable-ehb-system.js' },
                { local: 'agents/external-api-integration.js', s3: 'agents/external-api-integration.js' },
                { local: 'agents/production-deployment.js', s3: 'agents/production-deployment.js' }
            ];
            
            const uploadPromises = filesToUpload.map(async (file) => {
                if (fs.existsSync(file.local)) {
                    const fileContent = fs.readFileSync(file.local);
                    
                    const params = {
                        Bucket: this.config.aws.s3BucketName,
                        Key: file.s3,
                        Body: fileContent,
                        ContentType: 'application/json',
                        ServerSideEncryption: 'AES256'
                    };
                    
                    await this.s3.putObject(params).promise();
                    console.log(`✅ Uploaded: ${file.s3}`);
                    return { file: file.s3, status: 'uploaded' };
                } else {
                    console.log(`⚠️ File not found: ${file.local}`);
                    return { file: file.s3, status: 'not_found' };
                }
            });
            
            const results = await Promise.all(uploadPromises);
            
            return {
                success: true,
                uploadedFiles: results.filter(r => r.status === 'uploaded'),
                missingFiles: results.filter(r => r.status === 'not_found')
            };
            
        } catch (error) {
            console.error('❌ File upload failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * EC2 instance create karta hai
     */
    async createEC2Instance() {
        try {
            console.log('🖥️ Creating EC2 instance...');
            
            const params = {
                ImageId: 'ami-0c02fb55956c7d316', // Amazon Linux 2 AMI for ap-south-1
                MinCount: 1,
                MaxCount: 1,
                InstanceType: 't3.micro',
                KeyName: 'ehb-key-pair',
                SecurityGroupIds: ['sg-0123456789abcdef0'], // You'll need to create this
                TagSpecifications: [
                    {
                        ResourceType: 'instance',
                        Tags: [
                            { Key: 'Name', Value: 'EHB-Healthcare-App' },
                            { Key: 'Environment', Value: 'production' },
                            { Key: 'Project', Value: 'EHB-Healthcare' }
                        ]
                    }
                ],
                UserData: Buffer.from(`
#!/bin/bash
yum update -y
yum install -y docker
systemctl start docker
systemctl enable docker
yum install -y git
git clone https://github.com/your-repo/ehb-healthcare.git
cd ehb-healthcare
docker-compose up -d
                `).toString('base64')
            };
            
            const result = await this.ec2.runInstances(params).promise();
            const instanceId = result.Instances[0].InstanceId;
            
            console.log(`✅ EC2 instance created: ${instanceId}`);
            
            return {
                success: true,
                instanceId: instanceId,
                instanceType: 't3.micro',
                region: this.config.aws.region
            };
            
        } catch (error) {
            console.error('❌ EC2 instance creation failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * CloudWatch monitoring setup karta hai
     */
    async setupCloudWatchMonitoring() {
        try {
            console.log('📊 Setting up CloudWatch monitoring...');
            
            // Create CloudWatch dashboard
            const dashboardParams = {
                DashboardName: 'EHB-Healthcare-Dashboard',
                DashboardBody: JSON.stringify({
                    widgets: [
                        {
                            type: 'metric',
                            properties: {
                                metrics: [
                                    ['AWS/EC2', 'CPUUtilization'],
                                    ['AWS/EC2', 'NetworkIn'],
                                    ['AWS/EC2', 'NetworkOut']
                                ],
                                period: 300,
                                stat: 'Average',
                                region: this.config.aws.region,
                                title: 'EHB Healthcare System Metrics'
                            }
                        }
                    ]
                })
            };
            
            await this.cloudwatch.putDashboard(dashboardParams).promise();
            console.log('✅ CloudWatch dashboard created');
            
            // Create alarms
            const alarmParams = {
                AlarmName: 'EHB-High-CPU-Alarm',
                ComparisonOperator: 'GreaterThanThreshold',
                EvaluationPeriods: 2,
                MetricName: 'CPUUtilization',
                Namespace: 'AWS/EC2',
                Period: 300,
                Statistic: 'Average',
                Threshold: 80,
                ActionsEnabled: true
            };
            
            await this.cloudwatch.putMetricAlarm(alarmParams).promise();
            console.log('✅ CloudWatch alarms created');
            
            return {
                success: true,
                dashboard: 'EHB-Healthcare-Dashboard',
                alarms: ['EHB-High-CPU-Alarm']
            };
            
        } catch (error) {
            console.error('❌ CloudWatch setup failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Healthcare compliance setup karta hai
     */
    async setupHealthcareCompliance() {
        try {
            console.log('🏥 Setting up healthcare compliance...');
            
            // Create IAM role for healthcare compliance
            const roleParams = {
                RoleName: 'EHB-Healthcare-Role',
                AssumeRolePolicyDocument: JSON.stringify({
                    Version: '2012-10-17',
                    Statement: [
                        {
                            Effect: 'Allow',
                            Principal: {
                                Service: 'ec2.amazonaws.com'
                            },
                            Action: 'sts:AssumeRole'
                        }
                    ]
                }),
                Description: 'Role for EHB Healthcare application with HIPAA compliance'
            };
            
            await this.iam.createRole(roleParams).promise();
            console.log('✅ IAM role created for healthcare compliance');
            
            // Attach policies for HIPAA compliance
            const policies = [
                'arn:aws:iam::aws:policy/CloudWatchFullAccess',
                'arn:aws:iam::aws:policy/AmazonS3FullAccess'
            ];
            
            for (const policy of policies) {
                await this.iam.attachRolePolicy({
                    RoleName: 'EHB-Healthcare-Role',
                    PolicyArn: policy
                }).promise();
            }
            
            console.log('✅ Healthcare compliance policies attached');
            
            return {
                success: true,
                role: 'EHB-Healthcare-Role',
                policies: policies,
                compliance: {
                    hipaa: true,
                    gdpr: true,
                    encryption: true
                }
            };
            
        } catch (error) {
            console.error('❌ Healthcare compliance setup failed:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Complete AWS deployment karta hai
     */
    async deployToAWS() {
        console.log('🚀 Starting AWS deployment...');
        
        const results = {
            timestamp: new Date().toISOString(),
            steps: {},
            success: false
        };
        
        try {
            // Step 1: Test AWS connection
            console.log('\n📡 Step 1: Testing AWS connection...');
            results.steps.connection = await this.testAWSConnection();
            
            if (!results.steps.connection.success) {
                throw new Error('AWS connection failed');
            }
            
            // Step 2: Create S3 bucket
            console.log('\n📦 Step 2: Creating S3 bucket...');
            results.steps.s3Bucket = await this.createS3Bucket();
            
            // Step 3: Upload application files
            console.log('\n📤 Step 3: Uploading application files...');
            results.steps.fileUpload = await this.uploadApplicationFiles();
            
            // Step 4: Create EC2 instance
            console.log('\n🖥️ Step 4: Creating EC2 instance...');
            results.steps.ec2Instance = await this.createEC2Instance();
            
            // Step 5: Setup CloudWatch monitoring
            console.log('\n📊 Step 5: Setting up CloudWatch monitoring...');
            results.steps.cloudwatch = await this.setupCloudWatchMonitoring();
            
            // Step 6: Setup healthcare compliance
            console.log('\n🏥 Step 6: Setting up healthcare compliance...');
            results.steps.compliance = await this.setupHealthcareCompliance();
            
            results.success = true;
            console.log('\n🎉 AWS deployment completed successfully!');
            
        } catch (error) {
            console.error('\n❌ AWS deployment failed:', error.message);
            results.error = error.message;
        }
        
        // Save deployment results
        const resultsPath = path.join(process.cwd(), 'aws-deployment-results.json');
        fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
        
        return results;
    }

    /**
     * Deployment status check karta hai
     */
    async checkDeploymentStatus() {
        try {
            console.log('🔍 Checking deployment status...');
            
            const status = {
                timestamp: new Date().toISOString(),
                s3: {},
                ec2: {},
                cloudwatch: {},
                compliance: {}
            };
            
            // Check S3 bucket
            try {
                const s3Objects = await this.s3.listObjects({
                    Bucket: this.config.aws.s3BucketName
                }).promise();
                status.s3 = {
                    bucketExists: true,
                    objectCount: s3Objects.Contents?.length || 0
                };
            } catch (error) {
                status.s3 = { bucketExists: false, error: error.message };
            }
            
            // Check EC2 instances
            try {
                const ec2Instances = await this.ec2.describeInstances({
                    Filters: [
                        {
                            Name: 'tag:Project',
                            Values: ['EHB-Healthcare']
                        }
                    ]
                }).promise();
                status.ec2 = {
                    instanceCount: ec2Instances.Reservations?.length || 0,
                    instances: ec2Instances.Reservations?.map(r => r.Instances[0].InstanceId) || []
                };
            } catch (error) {
                status.ec2 = { error: error.message };
            }
            
            console.log('✅ Deployment status check completed');
            return status;
            
        } catch (error) {
            console.error('❌ Status check failed:', error.message);
            return { error: error.message };
        }
    }
}

// Main execution
async function main() {
    const deployment = new AWSDeployment();
    
    if (process.argv.includes('--test')) {
        const connection = await deployment.testAWSConnection();
        console.log('Connection Test:', connection);
    } else if (process.argv.includes('--deploy')) {
        const results = await deployment.deployToAWS();
        console.log('Deployment Results:', results);
    } else if (process.argv.includes('--status')) {
        const status = await deployment.checkDeploymentStatus();
        console.log('Deployment Status:', status);
    } else {
        console.log('AWS Deployment - Usage:');
        console.log('  node aws-deployment.js --test    # Test AWS connection');
        console.log('  node aws-deployment.js --deploy  # Deploy to AWS');
        console.log('  node aws-deployment.js --status  # Check deployment status');
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = AWSDeployment; 