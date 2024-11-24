import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { PublishCommand, SNSClient } from "@aws-sdk/client-sns";

const snsClient = new SNSClient({});
const dynamoDBClient = new DynamoDBClient({})

export const handler = async (event: any) => {
    const tableName = process.env.TABLE_NAME;
    const topicArn = process.env.TOPIC_ARN;
    const filename = event.Records[0].dynamodb.NewImage.FileName.S;
    
    console.log(event.Records[0].dynamodb.NewImage.FileName.S);

    // await snsClient.send(new PublishCommand({
    //     TopicArn: topicArn,
    //     Message: ` Dear client, Your file ${file} record was successfully deleted from the database, (not from the storage)!`
    // }
    // ));
    // console.log('Notification sent!')

     //Publish to SNS - correct file extension
        await snsClient.send(new PublishCommand({
            TopicArn: topicArn,
            Message: ` Dear client, Your file extension is correct and will be uploaded to your database:
            File name: .${filename}`
        }
        ));

        console.log('Notification sent!')

    return {
        statusCode: 200,
        body: 'Pam-Pam-Pam-Pam-Max-Verstapen!'
    }
};