const express=require('express');
const bodyParser=require('body-parser');
const webdriver=require('selenium-webdriver');
const chrome=require('selenium-webdriver/chrome');
const chromepath=require('chromedriver').path;
const app=express();
const port=8080;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

const service=new chrome.ServiceBuilder(chromepath).build();
chrome.setDefaultService(service);

app.listen(port, function () {
    console.log("Listening on port: "+port);
});

app.get('/', function (req, res) {
    res.end("Welcome to HungerDeal. This instance is the HungerDeal API set. Please use our android app to continue.");
});

app.get('/search', function (req, res) {
    const keyword=req.query.keyword.trim().toLowerCase();
    const d_address=req.query.d_address.trim().toLowerCase();
    const restaurant=req.query.restaurant.trim().toLowerCase();
    const quantity=parseInt(req.query.quantity.trim());
    let response= {};

    if (keyword==="" || d_address==="" || restaurant===""|| quantity===0) {
        response['code']=-1;
        response['info']="Invalid request parameters";
        res.end(JSON.stringify(response));
        return;
    }

    Scrape(keyword, d_address, restaurant, quantity, response).then(function (result) {
        response['code']=1;
        response['info']="Scrape successful";
        response['result']=result;
        res.end(JSON.stringify(response));
    });
    //res.end("[]");
});


const Scrape=function (keyword, d_address, restaurant, quantity) {
    return new Promise(function (resolve, reject) {
        let result={};
        //ZomatoScrape(keyword, d_address, restaurant, quantity);
        SwiggyScrape(keyword, d_address, restaurant, quantity).then(function (res) {
            result['swiggy']=res;
            resolve(result);
        });
        //UbereatScrape(keyword, d_address, restaurant, quantity);
    });
};


const ZomatoScrape=function (keyword, d_address, restaurant, quantity) {
    return new Promise(function (resolve, reject) {
        let result={};
        result['code']=0;
        result['info']="Zomato scrape failed";
        let driver=new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).build();
        driver.get("https://www.zomato.com/").then(function () {
            driver.findElement(webdriver.By.id("location_input")).sendKeys(d_address);
        });
    });
};


const SwiggyScrape=function (keyword, d_address, restaurant, quantity) {
    return new Promise(function (resolve, reject) {
        let result= {};
        result['code']=0;
        result['info']="Swiggy scrape failed";
        let driver=new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).build();
        driver.get("https://www.swiggy.com/").then(function () {
            driver.findElement(webdriver.By.id('location')).sendKeys(d_address, webdriver.Key.RETURN);
            let search_item=webdriver.By.xpath("//div[@class='_3lmRa' and @tabindex='2']");
            driver.wait(webdriver.until.elementLocated(search_item)).then(function () {
                let resp= driver.findElement(webdriver.By.xpath("(//span[@class='_2W-T9'])[1]")).getText();
                resp.then(function (text) {
                    result['location']=text;
                });
                driver.findElement(search_item).click();    //click on main location search
                search_item=webdriver.By.xpath("//a[@class='_1T-E4' and @href='/search']");
                driver.wait(webdriver.until.elementLocated(search_item)).then(function () {
                    driver.findElement(search_item).click();    //click on search button
                    search_item=webdriver.By.className('_2BJMh');
                    driver.wait(webdriver.until.elementLocated(search_item)).then(function () {
                        driver.findElement(search_item).sendKeys(restaurant, webdriver.Key.RETURN);    //search item and press enter
                        search_item=webdriver.By.xpath("(//a[@class='_1j_Yo'])[1]");
                        driver.wait(webdriver.until.elementsLocated(search_item)).then(function () {
                            driver.findElement(search_item).click();    //pick first item on search
                            search_item=webdriver.By.className("_5mXmk");
                            driver.wait(webdriver.until.elementsLocated(search_item)).then(function () {
                                resp= driver.findElement(webdriver.By.className("_3aqeL")).getText();
                                resp.then(function (text) {
                                    result['restaurant']=text;
                                });
                                resp= driver.findElement(webdriver.By.className("Gf2NS")).getText();
                                resp.then(function (text) {
                                    text=text.split('|');
                                    result['outlet']=text[0].trim();
                                });
                                resp= driver.findElement(webdriver.By.xpath("(//div[@class='_2l3H5'])[1]")).getText();
                                resp.then(function (text) {
                                    result['rating']=text;
                                });
                                resp= driver.findElement(webdriver.By.xpath("(//div[@class='_2l3H5'])[2]")).getText();
                                resp.then(function (text) {
                                    result['delivery_time']=text;
                                });

                                driver.findElement(search_item).sendKeys(keyword, webdriver.Key.RETURN).then(function () {      //find keyword
                                    search_item=webdriver.By.xpath("(//div[@class='jTy8b'])");
                                    driver.wait(webdriver.until.elementsLocated(search_item)).then(function () {
                                        resp= driver.findElements(search_item);
                                        findMatches(resp, keyword).then(function (dt) {
                                            console.log(dt);
                                            let max_match_name=dt['max_match_name'];
                                            let max_match_i=dt['max_match_i'];
                                            let max_matches=dt['max_matches'];

                                            if (max_match_i===-1) {
                                                result['delivery_fee']="";
                                                result['item_total']="";
                                                result['total_price']="";
                                                result['code']=0;
                                                result['info']="Item not found";
                                            }
                                            sleep(2000).then(function () {
                                                search_item=webdriver.By.xpath("(//div[@class='_1RPOp'])["+max_match_i+"]");
                                                driver.findElement(search_item).click();    //click add button
                                                search_item=webdriver.By.xpath("//div[@class='_1gPB7']");
                                                driver.wait(webdriver.until.elementsLocated(search_item)).then(function () {
                                                    driver.findElement(search_item).click();    //click checkout
                                                    search_item=webdriver.By.className("_1ds9T");
                                                    driver.wait(webdriver.until.elementsLocated(search_item)).then(function () {
                                                        addQuantity(quantity, 0, driver, search_item).then(function (dt) {
                                                            result['delivery_fee']=dt['delivery_fee'];
                                                            result['item_total']=dt['item_total'];
                                                            result['total_price']=dt['price'];
                                                            result['code']=1;
                                                            result['info']="Swiggy scrape successful";
                                                            //driver.quit();
                                                            resolve(result);
                                                        })
                                                    });
                                                });
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
};


const UbereatScrape=function (keyword, d_address, restaurant, quantity) {
    return new Promise(function (resolve, reject) {
        let result= {};
        result['code']=0;
        result['info']="Ubereats scrape failed";
        let driver=new webdriver.Builder().withCapabilities(webdriver.Capabilities.chrome()).build();
        driver.get("https://www.ubereats.com/en-IN/").then(function () {
            sleep(1000).then(function () {
                driver.findElement(webdriver.By.id("location-enter-address-input")).sendKeys(d_address);    //send address to location
                driver.wait(webdriver.until.elementsLocated(webdriver.By.id('location-enter-address-input'))).then(function () {
                    driver.wait(webdriver.until.elementsLocated(webdriver.By.id("location-enter-address-item-0"))).then(function () {
                        driver.findElement(webdriver.By.id("location-enter-address-item-0")).click();   //click on first location
                        driver.wait(webdriver.until.elementsLocated(webdriver.By.xpath("//button[@class='ba bb bz']"))).then(function () {
                            driver.findElement(webdriver.By.xpath("//button[@class='ba bb bz']")).click();  //click on search
                            driver.wait(webdriver.until.elementsLocated(webdriver.By.name("userQuery"))).then(function () {
                                driver.findElement(webdriver.By.name("userQuery")).sendKeys(restaurant, webdriver.Key.RETURN);  //send restaurant name
                                driver.wait(webdriver.until.elementsLocated(webdriver.By.xpath("(//a[@class='ct cu cc'])[1]"))).then(function () {
                                    driver.findElement(webdriver.By.xpath("(//a[@class='ct cu cc'])[1]")).click();  //click on first restaurant
                                    driver.wait(webdriver.until.elementsLocated(webdriver.By.id('clamped-content-menu_item_title'))).then(function () {
                                        let resp=driver.findElements(webdriver.By.id('clamped-content-menu_item_title'));
                                        findMatches(resp, keyword).then(function (dt) {
                                            console.log(dt);
                                            let max_match_name=dt['max_match_name'];
                                            let max_match_i=dt['max_match_i']+1;
                                            let max_matches=dt['max_matches'];
                                            driver.wait(webdriver.until.elementsLocated(webdriver.By.xpath("(//a[@class='ba be cu'])["+max_match_i+"]"))).then(function () {
                                                driver.findElement(webdriver.By.xpath("(//a[@class='ba be cu'])["+max_match_i+"]")).click();
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    }).catch(function (err) {
                        console.log(err);
                    });
                });
            });
        });
    });
};


let findMatches=function (resp, keyword) {
    return new Promise(function (resolve, reject) {
        resp.then(function (list) {
            let max_matches=0;
            let max_match_i=-1;
            let max_match_name="";
            let matches=0;
            let name="";
            for (let i=0;i<list.length;i++) {
                list[i].getText().then(function (text) {
                    text=text.toLowerCase().trim();
                    text= text.replace("+", "");
                    text= text.replace("-", "");
                    name=text;
                    text=text.split(" ");
                    matches=0;
                    /*for (let j=0;j<text.length;j++) {
                        /!*if (keyword.includes(text[j].trim())) {
                            matches++;
                        }*!/
                    }*/
                    if (keyword.toLowerCase().trim()===name.toLowerCase().trim()) {
                        max_matches=matches;
                        max_match_i=i;
                        max_match_name=name;
                        //console.log("match found: "+ name+" i= "+i);
                    }
                    /*if (matches>max_matches) {
                        max_matches=matches;
                        max_match_i=i;
                        max_match_name=name;
                        console.log(matches);
                        console.log(i);
                        console.log(name);
                    }*/
                    if (i===list.length-1) {
                        let result=[];
                        result['max_match_name']=max_match_name;
                        result['max_match_i']=max_match_i;
                        result['max_matches']=max_matches;
                        resolve(result);
                    }
                });
            }
        });
    });
};


let addQuantity=function(quantity, c_quantity, driver, element) {
    return new Promise(function (resolve) {
        if (c_quantity>=quantity) {
            let search_temp=webdriver.By.className("_3ZAW1");
            driver.wait(webdriver.until.elementsLocated(search_temp)).then(function () {
                let txt=driver.findElement(search_temp).getText();
                txt.then(function (text) {
                    let result=[];
                    result['price']=text;
                    txt= driver.findElement(webdriver.By.xpath("(//span[@class='ZH2UW'])[1]")).getText();
                    txt.then(function (text) {
                        result['item_total']=text;
                        txt= driver.findElement(webdriver.By.xpath("(//span[@class='ZH2UW'])[3]")).getText();
                        txt.then(function (text) {
                            result['delivery_fee']=text;
                            resolve(result);
                        });
                    });
                });
            });
        }else {
            sleep(1500).then(function () {
                driver.findElement(element).click();
                addQuantity(quantity, ++c_quantity, driver, element).then(function (price) {
                    resolve(price);
                })
            });
        }
    });
};


let sleep=function (time) {
    return new Promise(function (resolve) {
        setTimeout(resolve,time);
    });
};