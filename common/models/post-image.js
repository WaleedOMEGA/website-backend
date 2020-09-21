'use strict';

const sharp = require('sharp');
const fs = require('fs');
const {post} = require('../../server/server');
const CONTAINER_URL = '/api/containers/';
module.exports = function(Postimage) {
  Postimage.upload = function(ctx, options, access_token, post_id, user_id, cb) {
    if (!options) options = {};
    ctx.req.params.container = 'postImages';
    if (!fs.existsSync('./server/storage/' + ctx.req.params.container)) {
      fs.mkdirSync('./server/storage/' + ctx.req.params.container);
    }
    Postimage.app.models.ImageFile.upload(ctx.req, ctx.result, options, (err, file) => {
      if (err) {
        cb(err);
      } else {
        var fileInfo = file.files.file[0];
        sharp(
                  './server/storage/' +
                    ctx.req.params.container +
                    '/' +
                    fileInfo.name
                )
                  .resize(100)
                  .toFile(
                    './server/storage/' +
                      ctx.req.params.container +
                      '/100-' +
                      fileInfo.name, (err) => {
                        if (!err) {
                          Postimage.create({
                            url:
                                  CONTAINER_URL +
                                  fileInfo.container +
                                  '/download/' +
                                  fileInfo.info,
                            thumbnail:
                                  CONTAINER_URL +
                                  fileInfo.container +
                                  '/download/100-' +
                                      fileInfo.info,
                            created_at: new Date(),
                            postId: post_id,
                            userId: user_id,
                          }, (err2, image) => {
                            if (err2) {
                              cb(err2);
                            } else {
                              cb(null, image);
                            }
                          });
                        }
                      }
                  );
      }
    });
  };
  Postimage.remoteMethod('upload', {
    description: 'upload a file',
    accepts: [
        {arg: 'ctx', type: 'object', http: {source: 'context'}},
        {arg: 'options', type: 'object', http: {source: 'query'}},
        {arg: 'access_token', type: 'string'},
        {arg: 'post_id', type: 'string'},
        {arg: 'user_id', type: 'string'},
    ],
    returns: {
      arg: 'fileObject',
      type: 'object',
      root: true,
    },
    http: {verb: 'post'},
  });
};
