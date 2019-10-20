const express=require('express');
const bodyParser=require('body-parser');
const webdriver=require('selenium-webdriver');
const chrome=require('selenium-webdriver/chrome');
const chromepath=require('chromedriver').path;
const firefox=require('selenium-webdriver/firefox');
const gekodriverpath=require('geckodriver').path;
const app=express();
const port=8080;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

const service=new chrome.ServiceBuilder(chromepath).build();
chrome.setDefaultService(service);

new firefox.ServiceBuilder(gekodriverpath).build();
new firefox.Options(service);

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
    const city=req.query.city.trim().toLowerCase();
    let response= {};

    if (keyword==="" || d_address==="" || restaurant===""|| quantity===0 || city==="") {
        response['code']=-1;
        response['info']="Invalid request parameters";
        res.end(JSON.stringify(response));
        return;
    }

    Scrape(keyword, d_address, restaurant, quantity, response, city, 0, 0).then(function (result) {
        response['code']=1;
        response['info']="Scrape successful";
        response['result']=result;
        res.end(JSON.stringify(response));
    });
    //res.end("[]");
});


const Scrape=function (keyword, d_address, restaurant, quantity, result, city, c, k) {
    return new Promise(function (resolve, reject) {
        /*//ZomatoScrape(keyword, d_address, restaurant, quantity);
        if (c===0) {
            /!*SwiggyScrape(keyword, d_address, restaurant, quantity).then(function (res) {
                result['swiggy']=res;
                k++;
            });*!/
            /!*UbereatScrape(keyword, d_address, restaurant, quantity).then(function (res) {
                result['ubereats']=res;
                k++;
            });*!/
        }
        if (k===2) {
            resolve(result);
        }else {
            sleep(4000).then(function () {
                Scrape(keyword, d_address, restaurant, quantity, result, city, 1, k);
            })
        }*/
        ZomatoScrape(keyword, d_address, restaurant, quantity, city).then(function (res) {
            result['ubereats']=res;
            k++;
        });
    });
};


const ZomatoScrape=function (keyword, d_address, restaurant, quantity, city) {
    return new Promise(function (resolve, reject) {
        let result={};
        result['code']=0;
        result['info']="Zomato scrape failed";
        let driver=new webdriver.Builder().withCapabilities(webdriver.Capabilities.firefox()).build();
        driver.get("https://www.zomato.com/").then(function () {
            let search_item=webdriver.By.xpath("//div[@data-homepage_ui_tracking_element_id='location_input']");
            sleep(3500).then(function () {
                driver.wait(webdriver.until.elementsLocated(search_item)).then(function () {
                    driver.findElement(search_item).click();
                    search_item=webdriver.By.xpath("//input[@id='location_input']");
                    driver.wait(webdriver.until.elementsLocated(search_item)).then(function () {
                        driver.findElement(search_item).sendKeys(city);
                        search_item=webdriver.By.xpath("(//div[@class='item fontsize4 bb pt5 pb5 hover-bg'])[1]");
                        driver.wait(webdriver.until.elementsLocated(search_item)).then(function () {
                            driver.findElement(search_item).click();
                            sleep(3000).then(function () {

                            });
                            /*sleep(5000).then(function () {
                                search_item=webdriver.By.className('location prompt');
                                driver.wait(webdriver.until.elementsLocated(search_item)).then(function () {
                                   driver.findElement(search_item).sendKeys(d_address);
                                   search_item=webdriver.By.xpath("(//a[@class='result'])[1]");
                                   driver.findElement(search_item).click();
                                   search_item=webdriver.By.xpath("//div[@class='ui fluid green fluid button go-location homepage']");
                                   driver.findElement(search_item).click();
                                });
                                /!*search_item=webdriver.By.id('keywords_container');
                                driver.wait(webdriver.until.elementsLocated(search_item)).then(function () {
                                    driver.findElement(search_item).click();
                                    search_item=webdriver.By.id('keywords_input');
                                    driver.wait(webdriver.until.elementsLocated(search_item)).then(function () {
                                        driver.findElement(search_item).sendKeys(restaurant, webdriver.Key.RETURN);
                                    });
                                });*!/
                            });*/
                        });
                    });
                });
            });
        });
    });
};


const SwiggyScrape=function (keyword, d_address, restaurant, quantity) {
    return new Promise(function (resolve, reject) {
        let result= {};
        result['code']=0;
        result['info']="Swiggy scrape failed";
        let driver=new webdriver.Builder().withCapabilities(webdriver.Capabilities.firefox()).build();
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
                                    sleep(1000).then(function () {
                                        search_item=webdriver.By.xpath("//div[@class='_2wg_t']");
                                        driver.wait(webdriver.until.elementsLocated(search_item)).then(function () {
                                            resp= driver.findElements(search_item);
                                            findSwiggyMatches(resp, keyword).then(function (dt) {
                                                //console.log(dt);
                                                let max_match_name=dt['max_match_name'];
                                                let max_match_i=dt['max_match_i'];
                                                let max_matches=dt['max_matches'];
                                                let customizable=dt['customizable'];

                                                if (max_match_i===-1) {
                                                    result['delivery_fee']="";
                                                    result['item_total']="";
                                                    result['total_price']="";
                                                    result['code']=0;
                                                    result['info']="Item not found";
                                                    driver.quit();
                                                    resolve(result);
                                                    return;
                                                }

                                                result['item_name']=max_match_name;
                                                result['customizable']=customizable;
                                                if (customizable===1) {
                                                    result['delivery_fee']="";
                                                    result['item_total']="";
                                                    result['total_price']="";
                                                    result['code']=2;       //combo pack
                                                    result['info']="Item is a Combo pack";
                                                    driver.quit();
                                                    resolve(result);
                                                    return;
                                                }
                                                //search_item=webdriver.By.xpath("(//div[@class='_1RPOp'])["+max_match_i+"]");
                                                //driver.findElement(search_item).click();    //click add button
                                                search_item=webdriver.By.xpath("//div[@class='_1gPB7']");
                                                driver.wait(webdriver.until.elementsLocated(search_item)).then(function () {
                                                    driver.findElement(search_item).click();    //click checkout
                                                    search_item=webdriver.By.className("_1ds9T");
                                                    driver.wait(webdriver.until.elementsLocated(search_item)).then(function () {
                                                        addQuantity(quantity, 0, driver, search_item).then(function (dt) {
                                                            result['delivery_fee']=dt['delivery_fee'];
                                                            result['restaurant_charges']=dt['restaurant_charges'];
                                                            result['item_total']=dt['item_total'];
                                                            result['total_price']=dt['price'];
                                                            result['code']=1;
                                                            result['info']="Swiggy scrape successful";
                                                            driver.quit();
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
        let driver=new webdriver.Builder().withCapabilities(webdriver.Capabilities.firefox()).build();
        driver.get("https://www.ubereats.com/en-IN/").then(function () {
            sleep(1500).then(function () {
                let search_term=webdriver.By.id("location-enter-address-input");
                driver.findElement(search_term).sendKeys(d_address);    //send address to location
                driver.wait(webdriver.until.elementsLocated(search_term)).then(function () {
                    search_term=webdriver.By.id("location-enter-address-item-0");
                    driver.wait(webdriver.until.elementsLocated(search_term)).then(function () {
                        driver.findElement(search_term).click();   //click on first location
                        search_term=webdriver.By.xpath("//button[contains(@class, 'ao aq cc') or contains(@class, 'ao aq ca')]");
                        driver.wait(webdriver.until.elementsLocated(search_term)).then(function () {
                            driver.findElement(search_term).click();  //click on search
                            search_term=webdriver.By.name("userQuery");
                            driver.wait(webdriver.until.elementsLocated(search_term)).then(function () {
                                driver.findElement(search_term).sendKeys(restaurant, webdriver.Key.RETURN);  //send restaurant name
                                // search_term=webdriver.By.xpath("//a[contains(@class, 'at az') or contains(@class, 'at gc az') or contains(@class, 'at gd az')]");
                                search_term=webdriver.By.className("at az");
                                driver.wait(webdriver.until.elementsLocated(search_term)).then(function () {
                                    let resp=driver.findElements(search_term);
                                    resp.then(function (list) {
                                        list[0].click();    //click first restaurant
                                        search_term=webdriver.By.xpath("//a[contains(@class, 'ao b3') or contains(@class, 'ao bn')]");
                                        driver.wait(webdriver.until.elementsLocated(search_term)).then(function () {
                                            let respi=driver.findElements(search_term);  //list all dishes and click on match
                                            search_term=webdriver.By.xpath("//h1");
                                            // [contains(@class, 'b8 b9 ba cr cs ct cu') or contains(@class, 'b4 b5 b6 c0 c1 c2')]
                                            driver.wait(webdriver.until.elementsLocated(search_term)).then(function () {
                                                resp=driver.findElement(search_term).getText();
                                                resp.then(function (txt) {
                                                    result['restaurant']=txt.trim();
                                                    search_term=webdriver.By.xpath("//div[contains(@class, 'ao er') or contains(@class, 'ao eq')]");
                                                    driver.wait(webdriver.until.elementsLocated(search_term)).then(function () {
                                                        resp=driver.findElement(search_term).getText();
                                                        resp.then(function (txt) {
                                                            txt=txt.split("\n");
                                                            result['delivery_time']=txt[0].toString();
                                                            result['rating']=txt[1];
                                                            search_term=webdriver.By.xpath("//p[contains(@class, 'b4 b5 b6 dw dx b9') or contains(@class, 'b8 b9 ba c6 c7 bd') or contains(@class, 'b4 b5 b6 dx dy b9') or contains(@class, 'b4 b5 b6 dw dx b9')]");
                                                            driver.wait(webdriver.until.elementsLocated(search_term), 1500).then(function () {
                                                                driver.findElement(search_term).getText().then(function (txt) {
                                                                    txt=txt.split("•");
                                                                    result['outlet']=txt[0].trim().toString();
                                                                    findUberMatches(respi, keyword).then(function (dt) {
                                                                        //console.log(dt);
                                                                        let max_match_name=dt['max_match_name'];
                                                                        let max_match_i=dt['max_match_i']+1;
                                                                        let max_matches=dt['max_matches'];
                                                                        let customizable=dt['customizable'];

                                                                        if (max_match_i===-1) {
                                                                            result['delivery_fee']="";
                                                                            result['item_total']="";
                                                                            result['total_price']="";
                                                                            result['code']=0;
                                                                            result['info']="Item not found";
                                                                            driver.quit();
                                                                            resolve(result);
                                                                            return;
                                                                        }

                                                                        result['item_name']=max_match_name;
                                                                        result['customizable']=customizable;
                                                                        search_term=webdriver.By.xpath("//button[contains(@class, 'b4 b5 b6 b7 b8')]");
                                                                        driver.wait(webdriver.until.elementsLocated(search_term)).then(function () {    //click on add quantity
                                                                            resp=driver.findElements(search_term);
                                                                            resp.then(function (list) {
                                                                                for (let i=1;i<quantity;i++) {
                                                                                    list[1].click();
                                                                                }
                                                                                search_term=webdriver.By.xpath("//button[contains(@class, 'b4 b5 ca b7 b8') or contains(@class, 'b4 b5 by b7 b8')]");
                                                                                driver.findElement(search_term).click().then(function () {      //click on add to cart
                                                                                    /*search_term=webdriver.By.xpath("//a[contains(@class, 'ce ao ar aq el gs gt cf') or contains(@href, '/en-IN/checkout/')]");
                                                                                     driver.wait(webdriver.until.elementsLocated(search_term)).then(function () {     //click in checkout
                                                                                         driver.findElement(search_term).click();
                                                                                     });*/
                                                                                    sleep(2000).then(function () {
                                                                                        driver.get('https://www.ubereats.com/en-IN/checkout/').then(function () {
                                                                                            sleep(4000).then(function () {
                                                                                                search_term=webdriver.By.xpath("(//div[contains(@class, 'am av aw')])[4]");
                                                                                                driver.wait(webdriver.until.elementsLocated(search_term)).then(function () {
                                                                                                    search_term=webdriver.By.xpath("//div[contains(@class, 'am av aw')]");
                                                                                                    resp=driver.findElements(search_term);
                                                                                                    resp.then(function (list) {
                                                                                                        let temp =[];
                                                                                                        let pro=new Promise(function (resolve) {
                                                                                                            for (let i=0; i<list.length;i++) {
                                                                                                                list[i].getText().then(function (txt) {
                                                                                                                    //console.log(txt);
                                                                                                                    txt=txt.split(" ");
                                                                                                                    if (txt.length>1) {
                                                                                                                        temp.push(parseFloat(txt[1]));
                                                                                                                    }
                                                                                                                    if (i===list.length-1) {
                                                                                                                        resolve(temp);
                                                                                                                    }
                                                                                                                });
                                                                                                            }
                                                                                                        });
                                                                                                        pro.then(function () {
                                                                                                            console.log(temp);
                                                                                                            temp.sort();
                                                                                                            result['item_total']=temp[1].toString();
                                                                                                            result['delivery_fee']=temp[0].toString();
                                                                                                            result['restaurant_charges']='0';
                                                                                                            result['total_price']=temp[2].toString();
                                                                                                            search_term=webdriver.By.xpath("//div[contains(@class, 'b8 b9 ba bb bc bd ao bu cw') or contains(@class, 'ag ah ai aj ak al am bk c6')]");
                                                                                                            resp=driver.findElements(search_term);
                                                                                                            resp.then(function (list) {
                                                                                                                list[2].getText().then(function (txt) {
                                                                                                                    result['location']=txt;
                                                                                                                    result['code']=1;
                                                                                                                    result['info']="ubereats scrape successful";
                                                                                                                    driver.quit();
                                                                                                                    resolve(result);
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
                                                            }).catch(function () {
                                                                findUberMatches(respi, keyword).then(function (dt) {
                                                                    //console.log(dt);
                                                                    let max_match_name=dt['max_match_name'];
                                                                    let max_match_i=dt['max_match_i']+1;
                                                                    let max_matches=dt['max_matches'];
                                                                    let customizable=dt['customizable'];

                                                                    if (max_match_i===-1) {
                                                                        result['delivery_fee']="";
                                                                        result['item_total']="";
                                                                        result['total_price']="";
                                                                        result['code']=0;
                                                                        result['info']="Item not found";
                                                                        driver.quit();
                                                                        resolve(result);
                                                                        return;
                                                                    }

                                                                    result['item_name']=max_match_name;
                                                                    result['customizable']=customizable;
                                                                    search_term=webdriver.By.xpath("//button[contains(@class, 'b4 b5 b6 b7 b8')]");
                                                                    driver.wait(webdriver.until.elementsLocated(search_term)).then(function () {    //click on add quantity
                                                                        resp=driver.findElements(search_term);
                                                                        resp.then(function (list) {
                                                                            for (let i=1;i<quantity;i++) {
                                                                                list[1].click();
                                                                            }
                                                                            search_term=webdriver.By.xpath("//button[contains(@class, 'b4 b5 ca b7 b8') or contains(@class, 'b4 b5 by b7 b8')]");
                                                                            driver.findElement(search_term).click().then(function () {      //click on add to cart
                                                                                /*search_term=webdriver.By.xpath("//a[contains(@class, 'ce ao ar aq el gs gt cf') or contains(@href, '/en-IN/checkout/')]");
                                                                                 driver.wait(webdriver.until.elementsLocated(search_term)).then(function () {     //click in checkout
                                                                                     driver.findElement(search_term).click();
                                                                                 });*/
                                                                                sleep(2000).then(function () {
                                                                                    driver.get('https://www.ubereats.com/en-IN/checkout/').then(function () {
                                                                                        sleep(0).then(function () {
                                                                                            search_term=webdriver.By.xpath("(//div[contains(@class, 'am av aw')])[4]");
                                                                                            driver.wait(webdriver.until.elementsLocated(search_term)).then(function () {
                                                                                                search_term=webdriver.By.xpath("//div[contains(@class, 'am av aw')]");
                                                                                                resp=driver.findElements(search_term);
                                                                                                resp.then(function (list) {
                                                                                                    let temp =[];
                                                                                                    let pro=new Promise(function (resolve) {
                                                                                                        for (let i=0; i<list.length;i++) {
                                                                                                            list[i].getText().then(function (txt) {
                                                                                                                //console.log(txt);
                                                                                                                txt=txt.split(" ");
                                                                                                                if (txt.length>1) {
                                                                                                                    temp.push(parseFloat(txt[1]));
                                                                                                                }
                                                                                                                if (i===list.length-1) {
                                                                                                                    resolve(temp);
                                                                                                                }
                                                                                                            });
                                                                                                        }
                                                                                                    });
                                                                                                    pro.then(function () {
                                                                                                        //console.log(temp);
                                                                                                        temp.sort();
                                                                                                        result['item_total']=temp[1].toString();
                                                                                                        result['delivery_fee']=temp[0].toString();
                                                                                                        result['restaurant_charges']='0';
                                                                                                        result['total_price']=temp[2].toString();
                                                                                                        search_term=webdriver.By.xpath("//div[contains(@class, 'b8 b9 ba bb bc bd ao bu cw') or contains(@class, 'ag ah ai aj ak al am bk c6')]");
                                                                                                        resp=driver.findElements(search_term);
                                                                                                        resp.then(function (list) {
                                                                                                            list[2].getText().then(function (txt) {
                                                                                                                result['location']=txt;
                                                                                                                result['code']=1;
                                                                                                                result['info']="ubereats scrape successful";
                                                                                                                driver.quit();
                                                                                                                resolve(result);
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
                                                        });
                                                    });
                                                });
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


let findSwiggyMatches=function (resp, keyword) {
    return new Promise(function (resolve, reject) {
        resp.then(function (list) {
            /*let max_matches=0;
            let max_match_i=-1;
            let max_match_name="";
            let matches=0;
            let name="";
            let c=0;
            for (let i=0;i<list.length;i++) {
                list[i].getText().then(function (txt) {
                    let dp=txt.split("\n");
                    let text="";
                    /!*if (dp.length>3) {
                        text=dp[1];
                    }else {
                        text=dp[1];
                    }*!/
                    text=dp[1];
                    text=text.toLowerCase().trim();
                    text= text.replace("+", "");
                    text= text.replace("-", "");
                    text= text.replace(".", "");
                    name=text;
                    console.log(text);
                    text=text.split(" ");
                    matches=0;

                    /!*if (keyword.toLowerCase().trim()===name.toLowerCase().trim() && c===0) {
                        console.log(name);
                        max_matches=matches;
                        max_match_i=i;
                        max_match_name=name;
                        list[i].findElement(webdriver.By.className("_1RPOp")).click();
                        //console.log("match found: "+ name+" i= "+i);
                        let result=[];
                        result['max_match_name']=max_match_name;
                        result['max_match_i']=max_match_i;
                        result['max_matches']=max_matches;
                        c=1;
                        resolve(result);
                    }*!/
                    if (matches>max_matches) {
                        max_matches=matches;
                        max_match_i=i;
                        max_match_name=name;
                        console.log(matches);
                        console.log(i);
                        console.log(name);
                    }
                });
            }*/
            let max_matches=0;
            let max_match_i=-1;
            let max_match_name="";
            let customize=0;
            let matches=0;
            list[0].getText().then(function (txt) {
                let dp=txt.split("\n");
                let text="";
                if (dp[1].trim()==="+") {
                    customize=1;
                    text=dp[3];
                }else {
                    text=dp[1];
                }
                /*if (dp.length>3) {
                text=dp[1];
                }else {
                    text=dp[1];
                }*/
                text=text.toLowerCase().trim();
                text= text.replace("+", "");
                text= text.replace("-", "");
                text= text.replace(".", "");
                text= text.replace("(", "");
                text= text.replace(")", "");
                text= text.replace("  ", " ");
                let name=text;
                text=text.split(" ");
                keyword=keyword.split(" ");
                matches=include(keyword, text);
                if (keyword.length===1) {
                    if (matches>=1) {
                        max_matches=matches;
                        max_match_i=0;
                        max_match_name=name;
                        list[0].findElement(webdriver.By.className("_1RPOp")).click();
                    }
                }else if (keyword.length===2) {
                    if (matches>=2) {
                        max_matches=matches;
                        max_match_i=0;
                        max_match_name=name;
                        list[0].findElement(webdriver.By.className("_1RPOp")).click();
                    }
                }else if (keyword.length===3){
                    if (matches>=2) {
                        max_matches=matches;
                        max_match_i=0;
                        max_match_name=name;
                        list[0].findElement(webdriver.By.className("_1RPOp")).click();
                    }
                }else {
                    if (matches>=3) {
                        max_matches=matches;
                        max_match_i=0;
                        max_match_name=name;
                        list[0].findElement(webdriver.By.className("_1RPOp")).click();
                    }
                }
                let result={};
                result['max_match_name']=max_match_name;
                result['max_match_i']=max_match_i;
                result['max_matches']=max_matches;
                result['customizable']=customize;
                resolve(result);
            });
        });
    });
};


let findUberMatches =function(resp, keyword) {
    return new Promise(function (resolve, reject) {
        resp.then(function (list) {
            let max_matches=0;
            let max_match_i=-1;
            let max_match_name="";
            let customize=0;
            let matches=0;
            for (let i=0;i<list.length;i++) {
                matches=0;
                list[i].getText().then(function (txt) {
                    //console.log(txt);
                    let dp=txt.split("\n");
                    let text="";
                    text=dp[0];
                    text=text.toLowerCase().trim();
                    text= text.replace("+", "");
                    text= text.replace("-", "");
                    text= text.replace(".", "");
                    text= text.replace("(", "");
                    text= text.replace(")", "");
                    text= text.replace("  ", " ");
                    let name=text;
                    // text=text.split(" ");
                    //console.log(text);
                    matches=include(keyword.split(" "), text.split(" "));
                    if (matches===text.split(" ").length) {
                        max_matches=matches;
                        max_match_i=i+1;
                        max_match_name=name;
                        let result={};
                        result['max_match_name']=max_match_name;
                        result['max_match_i']=max_match_i;
                        result['max_matches']=max_matches;
                        result['customizable']=customize;
                        list[i].click().catch(function () {
                        });
                        resolve(result);
                    }
                    if (i===list.length-1) {
                        let result={};
                        result['max_match_name']=max_match_name;
                        result['max_match_i']=max_match_i;
                        result['max_matches']=max_matches;
                        result['customizable']=customize;
                        resolve(result);
                    }
                });
            }
        });
    });
};


let include=function(list1, list2) {
    let matches=0;
    for (let i=0;i<list1.length;i++) {
        for (let j=0;j<list2.length;j++) {
            if (list1[i].trim()===list2[j].trim()) {
                matches++;
                break;
            }
        }
    }
    return matches;
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
                    txt= driver.findElements(webdriver.By.xpath("//span[@class='ZH2UW']"));
                    txt.then(function (list) {
                        list[0].getText().then(function (text) {
                            result['item_total']=text;
                        });
                        if (list.length===3){
                            list[2].getText().then(function (text) {
                                result['delivery_fee']=text;
                                result['restaurant_charges']='0';
                                resolve(result);
                            });
                        }else {
                            list[3].getText().then(function (text) {
                                result['restaurant_charges']=text;
                                list[5].getText().then(function (text) {
                                    result['delivery_fee']=text;
                                    resolve(result);
                                });
                            });
                        }
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