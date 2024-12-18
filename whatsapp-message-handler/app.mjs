import {SendWhatsAppMessageCommand, SocialMessagingClient} from "@aws-sdk/client-socialmessaging"; // ES Modules import

export const lambdaHandler = async (event) => {

    try {
        console.debug(JSON.stringify(event));
        // If the message is a text from customer, process it and respond
        const customerMessage = await getCustomerMessageDetails(event);
        console.debug(customerMessage)

        if (customerMessage === null) {
            console.info('Not a customer text message');
            return {
                statusCode: 200,
                body: JSON.stringify({"message": "Not a customer text message"}),
            };
        }

        console.info('Message from customer: ', JSON.stringify(customerMessage));

        await acknowledge(customerMessage);
        await reply(customerMessage);

        return {
            statusCode: 200,
            body: JSON.stringify({"message": "Message processed successfully"}),
        };
    } catch (e) {
        console.error(e);
        return {
            statusCode: 500,
            body: JSON.stringify({"message": "Error occurred while processing the message"}),
        };
    }
};

const acknowledge = async (customerMessage) => {
    const metaMessage = {
        "messaging_product": "whatsapp",
        "message_id": customerMessage.id,
        "status": "read"
    }
    await sendWhatsAppMessage(metaMessage);
}

const reply = async (customerMessage) => {
    let defaultMessage = `To implement more features, please visit https://aws.amazon.com/end-user-messaging/`

    if (customerMessage?.message?.toLowerCase().match(/^(hello|hi|hey|hiya)/i)) {
        await react(customerMessage);
        await sendOptions(customerMessage)
    } else {
        const metaMessage = {
            "messaging_product": "whatsapp",
            "to": "+" + customerMessage.from,
            "text": {
                "preview_url": false,
                "body": defaultMessage
            }
        };
        await sendWhatsAppMessage(metaMessage);
    }
}


const react = async (customerMessage) => {

    const reaction = "\uD83D\uDC4B" // Wave emoji
    const metaMessage = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": "+" + customerMessage.from,
        "type": "reaction",
        "reaction": {
            "message_id": customerMessage.id,
            "emoji": reaction
        }
    }
    await sendWhatsAppMessage(metaMessage);
}

const sendOptions = async (customerMessage) => {
    const metaTextMessage = {
        "messaging_product": "whatsapp",
        "to": "+" + customerMessage.from,
        "text": {
            "preview_url": false,
            "body": `Hello ${customerMessage.name ?? "there"}! How can we help you?`
        }
    };
    await sendWhatsAppMessage(metaTextMessage);

    // Keep the text under 20 characters
    const metaInteractiveMessage = {
        "messaging_product": "whatsapp",
        "to": "+" + customerMessage.from,
        "type": "interactive",
        "interactive": {
            "type": "button",
            "body": {
                "text": "Please choose:"
            },
            "action": {
                "buttons": [
                    {
                        "type": "reply",
                        "reply": {
                            "id": "OPTION_PLACE_ORDER",
                            "title": "Place a new order"
                        }
                    },
                    {
                        "type": "reply",
                        "reply": {
                            "id": "OPTION_CHECK_STATUS",
                            "title": "Check order status"
                        }
                    }
                ]
            }
        }
    }

    await sendWhatsAppMessage(metaInteractiveMessage)
}

const sendWhatsAppMessage = async (metaMessage) => {
    const phoneID = process.env.PHONE_NUMBER_ID;
    const metaApiVersion = "v20.0";
    const client = new SocialMessagingClient();

    const sendWhatsAppMessageRequest = {
        originationPhoneNumberId: phoneID,
        message: JSON.stringify(metaMessage),
        metaApiVersion: metaApiVersion,
    };

    console.debug(sendWhatsAppMessageRequest)
    const command = new SendWhatsAppMessageCommand(sendWhatsAppMessageRequest);
    const commandResponse = await client.send(command);
    console.debug(commandResponse);
}

const getCustomerMessageDetails = async (event) => {

    // Extract the AWS End User Messaging Social message from the SNS message
    const eumMessage = JSON.parse(event.Records[0].Sns.Message);

    // Extract the Meta WABA message from the eumMessage
    const webhookData = eumMessage.whatsAppWebhookEntry;
    const webhookDataParsed = typeof webhookData === 'string' ? JSON.parse(webhookData) : webhookData;

    console.debug(JSON.stringify(webhookDataParsed))

    const messageDetails = {
        name: webhookDataParsed?.changes?.[0]?.value?.contacts?.[0]?.profile?.name ?? null,
        from: webhookDataParsed?.changes?.[0]?.value?.messages?.[0]?.from ?? null,
        id: webhookDataParsed?.changes?.[0]?.value?.messages?.[0]?.id ?? null,
        message: webhookDataParsed?.changes?.[0]?.value?.messages?.[0]?.text?.body ?? null
    };

    if (!messageDetails.from) {
        return null;
    }

    return messageDetails;

}