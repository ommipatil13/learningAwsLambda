// Basic Hello World Lambda Function
exports.handler = async (event) => {
    return {
        statusCode: 200,
        body: JSON.stringify('Hello from AWS Lambda!')
    };
};
