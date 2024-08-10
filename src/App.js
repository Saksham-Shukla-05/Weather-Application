import { useEffect, useRef, useState } from "react";
import { FaSearch } from "react-icons/fa";
import { FiLoader } from "react-icons/fi";
import { MdCancel, MdDarkMode, MdDeleteOutline } from "react-icons/md";
import { RxSun } from "react-icons/rx";
function App() {
  const [DarkMode, setDarkMode] = useState(false);
  return (
    <div className={`app ${DarkMode ? "dark-mode" : "light-mode"}`}>
      <NavBar DarkMode={DarkMode} setDarkMode={setDarkMode} />
      <InputFeild DarkMode={DarkMode} />
    </div>
  );
}

function NavBar({ DarkMode, setDarkMode }) {
  return (
    <>
      <div className="app-2">
        <div className="heading">Weather Application</div>
        <Button DarkMode={DarkMode} setDarkMode={setDarkMode} />
      </div>
    </>
  );
}

function Button({ DarkMode, setDarkMode }) {
  return (
    <div>
      <div onClick={() => setDarkMode(!DarkMode)}>
        {!DarkMode ? (
          <MdDarkMode cursor={"pointer"} size={"23px"} className="light-mode" />
        ) : (
          <RxSun
            cursor={"pointer"}
            size={"23px"}
            className="dark-mode-for-btn"
          />
        )}
      </div>
    </div>
  );
}

function InputFeild({ DarkMode }) {
  const [City, setCity] = useState("");
  const [Loading, setIsLoading] = useState(false);
  const [FetchedData, setFetchedData] = useState();
  const [err, setErr] = useState("");
  const [forecast, setForecastData] = useState([]);
  const [ShowRecent, setShowRecent] = useState(false);
  const [flagData, setFlagData] = useState("");
  const RecentSearchRef = useRef(null);

  const [Searched, setSearched] = useState(() => {
    const storedSearches = localStorage.getItem("recent");
    return storedSearches ? JSON.parse(storedSearches) : [];
  });

  useEffect(() => {
    localStorage.setItem("recent", JSON.stringify(Searched));
  }, [Searched]);

  function handleCityChange(value) {
    setCity(value);
    setFetchedData(null);
    setForecastData(null);
    if (City.trim() === "") {
      setFetchedData(null);
      setForecastData(null);
      setShowRecent(true);
    }
    setErr("");
  }

  function OpenRecentSearch() {
    setErr("");
    setShowRecent(true);
  }
  function CloseRecentSearch() {
    setShowRecent(false);
  }

  function handleRecentSearch(event) {
    if (
      RecentSearchRef.current &&
      !RecentSearchRef.current.contains(event.target)
    ) {
      CloseRecentSearch();
    }
  }
  useEffect(
    function () {
      if (ShowRecent) {
        document.addEventListener("mousedown", handleRecentSearch);
      } else {
        document.removeEventListener("mousedown", handleRecentSearch);
      }

      return () => {
        document.removeEventListener("mousedown", handleRecentSearch);
      };
    },
    [ShowRecent]
  );

  async function fetchData() {
    if (City.trim() === "") {
      setErr("City name cannot be empty");
      return;
    }
    try {
      setIsLoading(true);
      setErr("");
      const data = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?units=metric&q=${City}&appid=4495ee9dca4401895cd9ac1e78ffddc8`
      );
      const result = await data.json();
      const flag = await fetch(
        `https://restcountries.com/v3.1/alpha/${result?.sys?.country}`
      );
      const flagData = result ? await flag.json() : "";
      setFlagData(flagData);
      if (result.cod !== "404") {
        setFetchedData(result);
        fetchForecastData();
        setSearched((prevSearches) => {
          const newSearches = [
            result.name,
            ...prevSearches.filter((name) => name !== result.name),
          ];
          return newSearches.splice(0, 5);
        });
        setShowRecent(false);
      }
      if (result.cod === "404") throw new Error(result.message);
    } catch (error) {
      setErr(error.message);
      setFetchedData(null);
      setShowRecent(false);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    }
  }

  async function fetchForecastData() {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/forecast?units=metric&q=${City}&appid=4495ee9dca4401895cd9ac1e78ffddc8`
      );
      const result = await response.json();

      const filteredData = result?.list?.filter((data) =>
        data.dt_txt.includes("00:00:00")
      );
      setForecastData(filteredData);
    } catch (error) {
      setErr(error.message);
    }
  }

  function handleRecentClicked(e) {
    setCity(() => e.target.innerHTML);
  }

  function ClearCityName() {
    setCity("");
    if (!forecast) return;
    setForecastData("");
    setFetchedData("");
  }
  function deleteRecent(name) {
    setSearched((prev) => [...prev].filter((prevName) => prevName !== name));
    console.log(name);

    // setSearched((prev) => console.log(prev));
  }

  return (
    <div className={`InputFeild ${DarkMode ? "dark-mode" : "light-mode"}`}>
      <div className="input-div">
        <div className={!DarkMode ? "main-inpt" : "custome-main-inpt"}>
          <input
            type="text"
            value={City}
            onChange={(e) => handleCityChange(e.target.value)}
            onClick={OpenRecentSearch}
            disabled={Loading}
            ref={RecentSearchRef}
            size={40}
            className={DarkMode ? "input-style" : ""}
            placeholder="Enter City Name"
          />
          <SearhAndCancleBtns
            fetchData={fetchData}
            City={City}
            ClearCityName={ClearCityName}
            DarkMode={DarkMode}
            Loading={Loading}
          />
          {err && <ErrorMsg customeMsg={err} setErr={setErr} />}
        </div>

        <div className="recentSeachParent" ref={RecentSearchRef}>
          {ShowRecent ? (
            <RecentShowComponent
              DarkMode={DarkMode}
              Searched={Searched}
              handleRecentClicked={handleRecentClicked}
              deleteRecent={deleteRecent}
            />
          ) : null}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {forecast && FetchedData ? (
          <>
            <Data data={FetchedData} DarkMode={DarkMode} flagData={flagData} />
            <NewForCastData
              data={forecast}
              DarkMode={DarkMode}
              forecast={forecast}
            />
          </>
        ) : (
          <div style={{ position: "absolute", top: "60%" }}>
            {<b>Nothing To Preview!!</b>}
          </div>
        )}
      </div>
    </div>
  );
}
function SearhAndCancleBtns({
  fetchData,
  Loading,
  DarkMode,
  ClearCityName,
  City,
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div onClick={fetchData}>
        {Loading ? (
          <Loader />
        ) : (
          <FaSearch
            size={"18px"}
            cursor={"pointer"}
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "5px",
            }}
            className={DarkMode ? "dark-mode" : "light-mode"}
          />
        )}
      </div>
      <div
        onClick={() => ClearCityName()}
        className={!City.trim() == " " ? " " : "diabled"}
      >
        <MdCancel
          cursor={"pointer"}
          size={"18px"}
          style={
            !City.trim() == " "
              ? {
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "5px",
                }
              : {
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  padding: "5px",
                  color: "red",
                }
          }
          className={DarkMode ? "dark-mode" : "light-mode"}
        />
      </div>
    </div>
  );
}

function RecentShowComponent({
  DarkMode,
  Searched,
  handleRecentClicked,
  deleteRecent,
}) {
  return (
    <div
      className="recentSearch"
      style={
        DarkMode
          ? {
              backgroundColor: "black",
            }
          : {
              backgroundColor: "white",
            }
      }
    >
      {Searched.length > 0 ? (
        <h3 style={{ marginBottom: "20px" }}>Recent Searches</h3>
      ) : (
        ""
      )}
      {Searched?.map((name, index) => (
        <div
          key={index}
          style={{
            display: "flex",
            width: "100%",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "2rem",
            flexWrap: "wrap",
          }}
        >
          <p
            style={{
              cursor: "pointer",
              flex: "3",
              textAlign: "left",
            }}
            role="button"
            onClick={(e) => {
              handleRecentClicked(e);
            }}
          >
            {name}
          </p>
          <div style={{ cursor: "pointer" }} onClick={() => deleteRecent(name)}>
            <MdDeleteOutline />
          </div>
        </div>
        //tabindex="0" see this property
      ))}
    </div>
  );
}
function Loader() {
  return (
    <FiLoader
      size={"18px"}
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "5px",
      }}
    />
  );
}
function ErrorMsg({ customeMsg, setErr }) {
  return (
    <div className="Err">
      <p>{customeMsg}</p>
    </div>
  );
}
function Data({ data, flagData }) {
  if (!data) return null;
  if (data.cod === "404") return null;
  const { main, weather, wind } = data;
  return (
    <div style={{ width: "100%", marginTop: "30px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "2rem",
        }}
      >
        <div>
          <p style={{ fontSize: "28px" }}>
            {data.sys === "IN"
              ? flagData[0]?.altSpellings[2]
              : flagData[0]?.altSpellings[1]}
          </p>
        </div>
        <div>
          <img
            style={{ marginTop: "10px" }}
            height={"20px"}
            width={"30px"}
            src={flagData[0].flags.png}
            alt={flagData[0].altSpellings[2]}
          />
        </div>
      </div>

      {/* <h4 style={{ textAlign: "center" }}>{data?.name}</h4> */}
      {data ? (
        <div className="MainData">
          <div className="childData">
            <div>Weather : {weather[0].description}</div>
            <div>Wind Speed : {wind.speed} Km/h</div>
            <div>Temp : {main.temp} °C</div>
            <div>Feels Like : {main.feels_like} °C</div>
            <div>Humidity : {main.humidity}%</div>
          </div>
          <div style={{ marginTop: "30px", marginBottom: "30px" }}>
            <ImageComp>
              <img
                height={"150px"}
                width={"150px"}
                src={`${process.env.PUBLIC_URL}/images/${weather[0].main}.png`}
                alt=""
              />
            </ImageComp>
          </div>
        </div>
      ) : (
        ""
      )}
    </div>
  );
}

function NewForCastData({ data, forecast, Darkmode }) {
  if (!data) return null;
  // console.log(data);

  return (
    <>
      <em
        style={{
          marginTop: "70px",
          padding: "20px",
          marginBottom: "-20px",
          borderTop: "2px solid",
        }}
      >
        Weather In UpComing Days
      </em>

      <div
        className="ScrollBar"
        style={
          forecast
            ? {
                display: "flex",
                justifyContent: "space-between",
                alignItems: "start",
                width: "100%",
                overflowX: "auto",
                marginTop: "50px",
              }
            : null
        }
      >
        {data.map((forecast, index) => (
          <ForecastItem key={index} data={forecast} Darkmode={Darkmode} />
        ))}
      </div>
    </>
  );
}

function ForecastItem({ data, Darkmode }) {
  const { main, weather, dt_txt, wind } = data;

  return (
    <div
      style={{
        marginTop: "20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexDirection: "column-reverse",
        textAlign: "center",
        minWidth: "350px",
        border: "2px solid",
      }}
    >
      <div
        style={{
          lineHeight: "50px",
          width: "100%",
        }}
      >
        <b className={!Darkmode ? "light-mode-line" : "dark-mode-line"}>
          <i>Date: {dt_txt.split(" ")[0]}</i>
        </b>
        <p>Wind Speed: {parseFloat(wind.speed).toFixed(1)} Km/h</p>
        <p>Weather: {weather[0].description}</p>
        <p>Feels Like: {parseFloat(main.feels_like).toFixed(1)} °C</p>
        <p>Temp : {parseFloat(main.temp).toFixed(1)} °C</p>
        <p>Humidity: {parseInt(main.humidity)}%</p>
      </div>

      <div>
        <ImageComp>
          <img
            height={"100px"}
            width={"100px"}
            src={`${process.env.PUBLIC_URL}/images/${weather[0].main}.png`}
            alt=""
          />
        </ImageComp>
      </div>
    </div>
  );
}

function ImageComp({ children }) {
  return children;
}
export default App;
