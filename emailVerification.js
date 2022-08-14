const awssdk = require("aws-sdk")
awssdk.config.update({ region: 'us-east-1' })
const documentClient = new awssdk.DynamoDB.DocumentClient()
const ses = new awssdk.SES()

exports.emailVerification = (event, context, callback) => {
    let emailId = event.Records[0].Sns.MessageAttributes.emailid.Value
    let tokenValue = event.Records[0].Sns.MessageAttributes.token.Value

    let getEmailListParams = {
        TableName: 'EmailListTbl',
        Key: {
            username: emailId
        }
    }

    let putEmailParams = {
        TableName: "EmailListTbl",
        Item: {
            username: emailId
        }
    }

    documentClient.get(getEmailListParams, function (err, emaillist) {
        if (err) console.log(err)
        else {
            console.log("email list is: " + emaillist)
            console.log("Number of emails in Email list" + Object.keys(emaillist).length)

            // If email not found, add email to list
            if (Object.keys(emaillist).length === 0) {
                let emailInfoParams = {
                    Destination: {
                        ToAddresses: [emailId]
                    },
                    Message: {
                        Body: {
                            Text: {
                                Data: "Verify your email  https://demo.vinothmani.me/v2/verifyUserEmail?email=" + emailId + "&token=" + tokenValue
                            }
                        },
                        Subject: {
                            Data: "AWS Email Verification"
                        }
                    },
                    Source: "noreply@demo.vinothmani.me"
                };

                ses.sendEmail(emailInfoParams, function (err, data) {
                    if (err) {
                        console.log(err)
                        callback(null, { err: err })
                    }
                    else {
                        console.log("Email sent to user for verification!");
                        documentClient.put(putEmailParams, (err, data) => {
                            if (err) {
                                console.log("Error in adding item to Email list table")
                            }
                            else {
                                console.log(`Email id ${putEmailParams.Item.emailid} added to sent list`)
                            }
                        })
                        callback(null, { data: data })
                    }
                });
            } else {
                console.log("Email already sent")
            }
        }
    })
}