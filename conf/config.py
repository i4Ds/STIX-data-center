import os 
basedir = os.path.abspath(os.path.dirname(__file__))

class MongoConfig:
    IP='localhost'
    user=''
    passwd=''
    port=27017

class LoggerConfig:
    import logging
    logging.basicConfig(filename='ip.log', format='%(asctime)s %(message)s', datefmt='%m/%d/%Y %I:%M:%S %p',
                    level=logging.INFO)



config={
        'mongodb': MongoConfig
        
        }
