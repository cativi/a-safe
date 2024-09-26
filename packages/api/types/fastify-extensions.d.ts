// a-safe/packages/api/types/fastify-extensions.d.ts

import { FastifyInstance, FastifyPlugin, FastifyRequest as OriginalFastifyRequest } from 'fastify'
import { Server as SocketIOServer, ServerOptions as SocketIOServerOptions } from 'socket.io'
import { Options } from 'multer'

// Declaraciones existentes...
declare module 'fastify' {
    interface FastifyInstance {
        io: SocketIOServer
    }

    interface FastifyRequest extends OriginalFastifyRequest {
        file?: {
            fieldname: string
            originalname: string
            encoding: string
            mimetype: string
            size: number
            destination: string
            filename: string
            path: string
            buffer: Buffer
        }
        files?: {
            [fieldname: string]: {
                fieldname: string
                originalname: string
                encoding: string
                mimetype: string
                size: number
                destination: string
                filename: string
                path: string
                buffer: Buffer
            }[]
        }
        user?: {
            id: string
            email: string
            role: string
        }
        parts(): AsyncIterableIterator<MultipartFile>
    }
}

declare module 'fastify-multer' {
    interface FastifyMulter extends FastifyPlugin {
        single(fieldName: string): any
        array(fieldName: string, maxCount?: number): any
        fields(fields: Array<{ name: string; maxCount?: number }>): any
        none(): any
    }
    const multer: (options?: Options) => FastifyMulter
    export = multer
}

declare module 'fastify-socket.io' {
    import { FastifyPluginCallback } from 'fastify'
    const fastifySocketIO: FastifyPluginCallback<SocketIOServerOptions>
    export default fastifySocketIO
}

// **Agregar Declaración para '@fastify/swagger-ui'**
declare module '@fastify/swagger-ui' {
    import { FastifyPluginAsync } from 'fastify'

    export interface FastifySwaggerUiOptions {
        routePrefix?: string
        uiConfig?: Record<string, any>
        uiHooks?: {
            onRequest?: (request: FastifyRequest, reply: FastifyReply, done: (err?: Error) => void) => void
            preHandler?: (request: FastifyRequest, reply: FastifyReply, done: (err?: Error) => void) => void
        }
        staticCSP?: boolean
        transformStaticCSP?: (header: string) => string
    }

    const fastifySwaggerUi: FastifyPluginAsync<FastifySwaggerUiOptions>
    export default fastifySwaggerUi
}
