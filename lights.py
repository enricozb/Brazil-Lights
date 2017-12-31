from subprocess import call

rooms = {
    'test': {
        '1f': '02001fff',
    },

    'general' : {
        'on': '020000ff',
        'off': '020001ff',
    },

    'enrico': {
        'center': '020016ff',
        'window': '020017ff',
        'off': '020018ff',
    },

    'marina': {
        'center': '020012ff',
        'lateral': ('020013ff', '140044696d6d6572205303{:02x}ff'),
        'bed': '020014ff',
        'balcony': '02002cff', # (can also be 2a) off is 2b
        'off': '020015ff',
    },

    'hallway': {
        'overlook': '020006ff',
        'rooms': '020007ff',
        'enrico': '020008ff',
        'off': '02002eff',
    },

    'kitchen': {
        'on': '020030ff',
        'center': '02000aff',
        'island': '02000bff',
        'sink': '02000cff',
        'lateral': '02000dff',
        'off': '02000eff',
    },

    'outside': {
        'counter': '020010ff',
        'main': '02000fff',
        'off': '020011ff'
    },

    'living room': {
        'center': ('020002ff', '140044494d4d4552204903{:02x}ff'),
        'outer lateral': ('020003ff', '140044494d4d4552204904{:02x}ff'),
        'inner lateral': ('020004ff', '140044494d4d4552204901{:02x}ff'),
        'small stairs': '020038ff',
        'doorway': '020009ff',
        'off': '020005ff'
    },

    'game room': {
        'center': '020021ff',        
        'lateral': '020022ff',
        'off': '020023ff'
    },

    'master bedroom': {
        'center': '020019ff',
        'door-side': '02001cff',
        'window-side': '02001bff',
        'lateral': '02001aff',
        'closet on': '02001eff',
        'closet off': '020020ff',
        'off': '02001dff'
    },

    'master bathroom': {
        'center': '020025ff',
        'shower': '020026ff',
        'bath': '020024ff',
        'sink': '020028ff',
        'toilet': '020027ff',
        'off': '020029ff',
    },

    'external': {
        'house-front': '02003bff',
        'deck & door': '02003cff',
        'firepit': '02003dff',
        'off': '02003eff'
    }
}


def send_bytes(data):
    with open('/tmp/brazil-light-packet', 'wb') as out:
        out.write(data)
    call(f'cat /tmp/brazil-light-packet | socat - UDP-DATAGRAM:255.255.255.255:8760,broadcast', shell=True)

def lights(area, action):
    data = rooms[area][action]
    if type(data) is str:
        send_bytes(bytes.fromhex(data))
    else:
        send_bytes(bytes.fromhex(data[0]))

testval = '140044494d4d45522049{:02x}{:02x}ff'
def test(test_area, test_value):
    data = bytes.fromhex(testval.format(test_area, test_value))
    send_bytes(data)

def dimmer(area, action, value):
    payload = bytes.fromhex(rooms[area][action][1].format(int(value)))
    send_bytes(payload)

