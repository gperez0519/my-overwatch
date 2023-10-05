function getPersistenceAdapter(tableName) {
  // This function is an indirect way to detect if this is part of an Alexa-Hosted skill
  function isAlexaHosted() {
    return process.env.S3_PERSISTENCE_BUCKET;
  }
  if (isAlexaHosted()) {
    const { S3PersistenceAdapter } = require("ask-sdk-s3-persistence-adapter");
    return new S3PersistenceAdapter({
      bucketName: process.env.S3_PERSISTENCE_BUCKET,
    });
  } else {
    // IMPORTANT: don't forget to give DynamoDB access to the role you're using to run this lambda (via IAM policy)
    const {
      DynamoDbPersistenceAdapter,
    } = require("ask-sdk-dynamodb-persistence-adapter");
    return new DynamoDbPersistenceAdapter({
      tableName: tableName || "my_overwatch",
      createTable: true,
    });
  }
}

module.exports = {
  getPersistenceAdapter,
};
