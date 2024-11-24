import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";
import { v4 } from "uuid";

const snsClient = new SNSClient({});
const dynamoDBClient = new DynamoDBClient({})

export const handler = async (event: any) => {
    const tableName = process.env.TABLE_NAME;
    const topicArn = process.env.TOPIC_ARN;

    //Extract filename, fileextension, filesize and date of uload
    const filename = event.Records[0].s3.object.key.split('/').pop();
    const fileextension = filename.includes('.') ? filename.split('.').pop().toLowerCase() : '';
    const filesize = event.Records[0].s3.object.size;
    const dou = new Date();

    console.log(filename);
    console.log(fileextension);

    if (!['pdf', 'jpg', 'png'].includes(fileextension || '')) {

        console.log('File extension is not .pdf, .jpg, or .png');

        //Publish to SNS - wrong file extension
        await snsClient.send(new PublishCommand({
            TopicArn: topicArn,
            Message: ` Dear client, Your file extension is not .pdf, .jpg, or .png, Your file is with extension .${fileextension}`
        }
        ));
        console.log('Notification sent!')

    } else {
        
        console.log('File extension is valid.');

        // //Publish to SNS - correct file extension
        // await snsClient.send(new PublishCommand({
        //     TopicArn: topicArn,
        //     Message: ` Dear client, Your file extension is correct
        //     File name: .${filename};
        //     File extension: .${fileextension};
        //     File size: ${filesize};
        //     Date of upload: ${dou}`
        // }
        // ));

        // console.log('Notification sent!')

        const ttl = Math.floor(Date.now() / 1000) + 30*60;

        //Write to DynamoDB Database
        await dynamoDBClient.send(new PutItemCommand(
            {
                TableName: tableName,
                Item: {
                    id: {
                        S: v4(),
                    },

                    FileName: {
                        S: `${filename}`,
                    },

                    FileSize: {
                        S: `${filesize}`,
                    },

                    FileExtension: {
                        S: `${fileextension}`,
                    },
                    
                    DateOfUpload: {
                        S: `${dou}`,
                    },
                    
                }
            }
        ))

      }


    return {
        statusCode: 200,
        body: 'Pam-Pam-Pam-Pam-Max-Verstapen!'
    }
};


