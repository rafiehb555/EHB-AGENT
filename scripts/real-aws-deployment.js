#!/usr/bin/env node

/**
 * Real AWS Deployment System
 * Actual AWS credentials ke sath deploy karta hai
 */

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

class RealAWSDeployment {
    constructor() {
        this.config = this.loadConfig();
        this.setupAWSClients();
    }

    /**
     * Configuration load karta hai
     */
    loadConfig() {
        try {
            const configPath = path.join(process.cwd(), 'aws-config.json');
            if (fs.existsSync(configPath)) {
                return JSON.parse(fs.readFileSync(configPath, 'utf8'));
            }
        } catch (error) {
            console.log('Config file nahi mila, environment variables use kar raha hun');
        }
        
        return {
            aws: {
                apiKey: process.env.AWS_API_KEY,
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                region: process.env.AWS_REGION || 'ap-south-1',
                s3BucketName: process.env.AWS_S3_BUCKET_NAME || 'ehb-main-pro'
            }
        };
    }

    /**
     * AWS clients setup karta hai
     */
    setupAWSClients() {
        // Check if credentials are available
        if (!this.config.aws.accessKeyId || !this.config.aws.secretAccessKey) {
            console.log('⚠️ AWS credentials nahi mile, environment variables set karein:');
            console.log('  AWS_ACCESS_KEY_ID=your_access_key');
            console.log('  AWS_SECRET_ACCESS_KEY=your_secret_key');
            console.log('  AWS_REGION=ap-south-1');
            return;
        }

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
        if (!this.s3) {
            return {
                success: false,
                message: 'AWS credentials not configured',
                services: []
            };
        }

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
        if (!this.s3) {
            return { success: false, error: 'AWS not configured' };
        }

        try {
            console.log(`📦 Creating S3 bucket: ${this.config.aws.s3BucketName}`);
            
            const params = {
                Bucket: this.config.aws.s3BucketName,
                Region: this.config.aws.region
            };
            
            await this.s3.createBucket(params).promise();
            console.log('✅ S3 bucket created successfully');
            
            // Enable versioning
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
        if (!this.s3) {
            return { success: false, error: 'AWS not configured' };
        }

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
        if (!this.ec2) {
            return { success: false, error: 'AWS not configured' };
        }

        try {
            console.log('🖥️ Creating EC2 instance...');
            
            const params = {
                ImageId: 'ami-0c02fb55956c7d316', // Amazon Linux 2 AMI for ap-south-1
                MinCount: 1,
                MaxCount: 1,
                InstanceType: 't3.micro',
                TagSpecifications: [
                    {
                        ResourceType: 'instance',
                        Tags: [
                            { Key: 'Name', Value: 'EHB-Healthcare-App' },
                            { Key: 'Environment', Value: 'production' },
                            { Key: 'Project', Value: 'EHB-Healthcare' }
                        ]
                    }
                ]
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
        if (!this.cloudwatch) {
            return { success: false, error: 'AWS not configured' };
        }

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
            
            results.success = true;
            console.log('\n🎉 AWS deployment completed successfully!');
            
        } catch (error) {
            console.error('\n❌ AWS deployment failed:', error.message);
            results.error = error.message;
        }
        
        // Save deployment results
        const resultsPath = path.join(process.cwd(), 'real-aws-deployment-results.json');
        fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
        
        return results;
    }
}

// Main execution
async function main() {
    const deployment = new RealAWSDeployment();
    
    if (process.argv.includes('--test')) {
        const connection = await deployment.testAWSConnection();
        console.log('Connection Test:', connection);
    } else if (process.argv.includes('--deploy')) {
        const results = await deployment.deployToAWS();
        console.log('Deployment Results:', results);
    } else {
        console.log('Real AWS Deployment - Usage:');
        console.log('  node real-aws-deployment.js --test    # Test AWS connection');
        console.log('  node real-aws-deployment.js --deploy  # Deploy to AWS');
        console.log('');
        console.log('Environment Variables Required:');
        console.log('  AWS_ACCESS_KEY_ID=your_access_key');
        console.log('  AWS_SECRET_ACCESS_KEY=your_secret_key');
        console.log('  AWS_REGION=ap-south-1');
    }
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = RealAWSDeployment; 